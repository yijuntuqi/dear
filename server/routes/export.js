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
            await projectDB.update(req.params.projectId, {
                generatedHtml: html,
                status: 'completed'
            });
        }
        
        // 创建临时文件夹
        const tmpDir = path.join(__dirname, '..', 'uploads', 'export_' + project.id + '_' + Date.now());
        fs.mkdirSync(tmpDir, { recursive: true });
        
        // 写入HTML文件
        const safeName = (project.owner_name || 'dear').replace(/[<>:"/\\|?*]/g, '_');
        fs.writeFileSync(path.join(tmpDir, safeName + '.html'), html);
        
        // 创建zip包
        const zipPath = tmpDir + '.zip';
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            res.download(zipPath, 'Dear_' + safeName + '_源码包.zip', (err) => {
                try {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                    fs.unlinkSync(zipPath);
                } catch (e) {}
            });
        });
        
        archive.on('error', (err) => {
            console.error('压缩失败:', err);
            res.status(500).json({ error: '压缩失败: ' + err.message });
        });
        
        archive.pipe(output);
        archive.directory(tmpDir, false);
        await archive.finalize();
        
    } catch (error) {
        console.error('导出失败:', error);
        res.status(500).json({ error: '导出失败: ' + error.message });
    }
});

// 下载单个HTML文件
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
        res.send(html);
        
    } catch (error) {
        console.error('下载HTML失败:', error);
        res.status(500).json({ error: '下载失败: ' + error.message });
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