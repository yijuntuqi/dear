const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { projectDB, userDB } = require('../lib/db');  // ← 添加 userDB
const { renderPage } = require('../lib/renderer');

const router = express.Router();

// 下载网页源码包 (ZIP)
router.get('/source/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const userId = project.user_id;
        const safeName = (project.owner_name || 'dear').replace(/[<>:"/\\|?*]/g, '_');
        
        // 生成 HTML
        let html = project.generated_html;
        if (!html) {
            html = await renderPage(project);
        }
        
        // 创建临时文件夹
        const tmpDir = path.join(__dirname, '..', 'temp', `dear_${project.id}_${Date.now()}`);
        fs.mkdirSync(tmpDir, { recursive: true });
        
        // 保存 index.html
        fs.writeFileSync(path.join(tmpDir, 'index.html'), html, 'utf-8');
        
        // 创建 ZIP 文件
        const zipPath = path.join(__dirname, '..', 'temp', `dear_${project.id}_${Date.now()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            res.download(zipPath, 'Dear_' + safeName + '_源码包.zip', async (err) => {
                // 清理临时文件
                try {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    fs.unlinkSync(zipPath);
                } catch (e) {}
                
                // VIP项目下载成功后自动降级
                if (!err && project.project_type !== 'free' && !project.vip_used) {
                    try {
                        await projectDB.markVipUsed(req.params.projectId);
                        await userDB.upgradePlan(userId, 'free');
                        console.log(`✅ 用户 ${userId} VIP降级为free`);
                    } catch (dbErr) {
                        console.error('降级失败:', dbErr);
                    }
                }
            });
        });
        
        archive.on('error', (err) => {
            console.error('压缩失败:', err);
            res.status(500).json({ error: '压缩失败' });
        });
        
        archive.pipe(output);
        archive.directory(tmpDir, false);
        await archive.finalize();
        
    } catch (error) {
        console.error('导出失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// HTML下载
router.get('/html/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const userId = project.user_id;
        
        let html = project.generated_html;
        if (!html) {
            html = await renderPage(project);
            await projectDB.update(req.params.projectId, {
                generatedHtml: html,
                status: 'completed'
            });
        }
        
        const safeName = (project.owner_name || 'dear').replace(/[<>:"/\\|?*]/g, '_');
        const filename = encodeURIComponent('Dear_' + safeName + '.html');
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename*=UTF-8\'\'' + filename);
        
        // 发送文件，并在完成后标记VIP使用并降级
        res.on('finish', async () => {
            if (project.project_type !== 'free' && !project.vip_used) {
                try {
                    await projectDB.markVipUsed(req.params.projectId);
                    await userDB.upgradePlan(userId, 'free');
                    console.log(`✅ 用户 ${userId} VIP降级为free`);
                } catch (dbErr) {
                    console.error('降级失败:', dbErr);
                }
            }
        });
        
        res.send(html);
        
    } catch (error) {
        console.error('下载失败:', error);
        res.status(500).json({ error: '下载失败' });
    }
});

// 预览HTML
router.get('/preview/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).send('项目不存在');
        
        let html = project.generated_html;
        if (!html) {
            html = await renderPage(project);
        }
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        
    } catch (error) {
        console.error('预览失败:', error);
        res.status(500).send('预览失败');
    }
});

module.exports = router;