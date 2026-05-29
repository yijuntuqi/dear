const express = require('express');
const jwt = require('jsonwebtoken');
const { projectDB, userDB } = require('../lib/db');
const { renderPage } = require('../lib/renderer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dear-secret';

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '请先登录' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'token无效' });
    }
}

// 创建项目
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { projectType, currentStep } = req.body;
        
        // 如果要创建VIP项目，只检查用户是不是VIP（不检查使用次数）
        if (projectType === 'vip') {
            const user = await userDB.getUser(req.userId);
            if (!user) {
                return res.status(404).json({ error: '用户不存在' });
            }
            if (user.plan_type !== 'vip') {
                return res.status(403).json({ error: '请先升级VIP' });
            }
            // 注意：不检查 vip_used！VIP项目允许创建，下载时才消耗权益
        }
        
        const project = await projectDB.create(req.userId, req.body, projectType || 'free');
        
        // 保存编辑步骤
        if (currentStep) {
            await projectDB.updateStep(project.id, currentStep);
        }
        
        res.json({ success: true, project });
    } catch (error) {
        console.error('创建项目失败:', error);
        res.status(500).json({ error: error.message || '创建失败' });
    }
});

// 更新项目
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await projectDB.update(req.params.id, req.body);
        res.json({ success: true, project });
    } catch (error) {
        console.error('更新项目失败:', error);
        res.status(500).json({ error: '更新失败' });
    }
});

// 更新项目状态（不需要登录，通过 projectId 访问）
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        console.log('📡 收到状态更新请求:', { id: req.params.id, status });
        const project = await projectDB.update(req.params.id, { status });
        console.log('📡 状态更新成功:', project.id, project.status);
        res.json({ success: true, project });
    } catch (error) {
        console.error('❌ 更新状态失败:', error);
        res.status(500).json({ error: '更新失败' });
    }
});

// 更新编辑步骤
router.put('/:id/step', authMiddleware, async (req, res) => {
    try {
        const { step } = req.body;
        const project = await projectDB.updateStep(req.params.id, step);
        res.json({ success: true, project });
    } catch (error) {
        console.error('更新步骤失败:', error);
        res.status(500).json({ error: '更新失败' });
    }
});

// 获取项目详情
router.get('/:id', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.id);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        res.json({ success: true, project });
    } catch (error) {
        console.error('获取项目失败:', error);
        res.status(500).json({ error: '获取失败' });
    }
});

// 获取用户的所有项目
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await projectDB.getUserProjects(req.userId);
        res.json({ success: true, projects });
    } catch (error) {
        console.error('获取项目列表失败:', error);
        res.status(500).json({ error: '获取失败' });
    }
});

// 删除项目
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await projectDB.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('删除项目失败:', error);
        res.status(500).json({ error: '删除失败' });
    }
});

// 生成网页HTML
router.post('/:id/render', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.id);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const html = await renderPage(project);
        
        // 只更新HTML，不改变status（草稿保持草稿）
        const updateData = { generatedHtml: html };
        // 只有已经 completed 的项目才保持 completed，草稿保持草稿
        if (project.status === 'completed') {
            updateData.status = 'completed';
        }
        await projectDB.update(req.params.id, updateData);
        
        res.json({ success: true, html });
    } catch (error) {
        console.error('生成失败:', error);
        res.status(500).json({ error: '生成失败' });
    }
});

// 确认下载（消耗VIP权益）
router.post('/:id/confirm-download', authMiddleware, async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: '项目不存在' });
        }
        
        // 标记项目VIP已使用
        await projectDB.markVipUsed(req.params.id);
        
        // 如果是VIP项目，下载后降级用户
        if (project.project_type === 'vip') {
            await userDB.upgradePlan(project.user_id, 'free');
            console.log(`✅ 用户 ${project.user_id} VIP权益已消耗，自动降级为free`);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('确认下载失败:', error);
        res.status(500).json({ error: '确认失败' });
    }
});

module.exports = router;