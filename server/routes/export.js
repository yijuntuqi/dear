const express = require('express');
const archiver = require('archiver');
const { projectDB, userDB } = require('../lib/db');
const { renderPage } = require('../lib/renderer');

const router = express.Router();

// 下载网页源码包 (ZIP) - 内存生成，适配 Vercel
router.get('/source/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });

        const userId = project.user_id;
        const safeName = (project.owner_name || 'dear').replace(/[<>:"/\\|?*]/g, '_');

        let html = project.generated_html;
        if (!html) {
            html = await renderPage(project);
        }

        // 在内存中生成 ZIP
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename*=UTF-8\'\'' + encodeURIComponent('Dear_' + safeName + '_源码包.zip'));

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.append(html, { name: safeName + '.html' });

        // 下载完成后自动降级
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

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename*=UTF-8\'\'' + encodeURIComponent('Dear_' + safeName + '.html'));

        // 下载完成后自动降级
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