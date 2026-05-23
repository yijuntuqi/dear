const express = require('express');
const jwt = require('jsonwebtoken');
const { projectDB } = require('../lib/db');
const { renderPage } = require('../lib/renderer');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dear-secret';

// 中间件：验证用户
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
        const project = await projectDB.create(req.userId, req.body);
        res.json({ success: true, project });
    } catch (error) {
        res.status(500).json({ error: '创建失败' });
    }
});

// 更新项目
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await projectDB.update(req.params.id, req.body);
        res.json({ success: true, project });
    } catch (error) {
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
        res.status(500).json({ error: '获取失败' });
    }
});

// 获取用户的所有项目
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await projectDB.getUserProjects(req.userId);
        res.json({ success: true, projects });
    } catch (error) {
        res.status(500).json({ error: '获取失败' });
    }
});

// 删除项目
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await projectDB.delete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
});

// 生成网页HTML
router.post('/:id/render', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.id);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const html = await renderPage(project);
        
        // 保存生成的HTML
        await projectDB.update(req.params.id, {
            generatedHtml: html,
            status: 'completed'
        });
        
        res.json({ success: true, html });
    } catch (error) {
        res.status(500).json({ error: '生成失败' });
    }
});

module.exports = router;