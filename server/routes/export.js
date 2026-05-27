const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { projectDB } = require('../lib/db');
const { renderPage } = require('../lib/renderer');

const router = express.Router();

// 下载网页源码包 (ZIP)
router.get('/source/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        // 生成 HTML
        let html = project.generated_html;
        if (!html) {
            html = await renderPage(project);
        }
        
        // 创建临时文件夹和ZIP...
        // （打包逻辑保持不变）
        
        output.on('close', () => {
            res.download(zipPath, 'Dear_' + safeName + '_源码包.zip', async (err) => {
                // 清理临时文件
                try {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    fs.unlinkSync(zipPath);
                } catch (e) {}
                
                // 【关键】下载成功后自动标记
                if (!err && project.project_type !== 'free' && !project.vip_used) {
                    try {
                        await projectDB.markVipUsed(req.params.projectId);
                        console.log(`项目 ${req.params.projectId} VIP权益已标记使用`);
                    } catch (dbErr) {
                        console.error('标记VIP失败:', dbErr);
                    }
                }
            });
        });
        
        archive.on('error', (err) => {
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

// HTML下载同样处理
router.get('/html/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
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
        
        // 发送文件，并在完成后标记VIP使用
        res.on('finish', async () => {
            if (project.project_type !== 'free' && !project.vip_used) {
                try {
                    await projectDB.markVipUsed(req.params.projectId);
                    console.log(`项目 ${req.params.projectId} VIP权益已标记使用`);
                } catch (dbErr) {
                    console.error('标记VIP失败:', dbErr);
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
        res.status(500).send('预览失败');
    }
});

module.exports = router;