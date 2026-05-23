const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { projectDB, exportDB } = require('../lib/db');

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

// 下载网页源码包
router.get('/source/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        if (!project.generated_html) {
            return res.status(400).json({ error: '请先生成网页' });
        }
        
        // 创建临时文件夹
        const tmpDir = path.join(__dirname, '..', 'uploads', `export_${project.id}_${Date.now()}`);
        fs.mkdirSync(tmpDir, { recursive: true });
        
        // 写入HTML文件
        fs.writeFileSync(path.join(tmpDir, 'index.html'), project.generated_html);
        
        // 创建zip包
        const zipPath = tmpDir + '.zip';
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        archive.directory(tmpDir, false);
        await archive.finalize();
        
        output.on('close', () => {
            res.download(zipPath, `Dear_${project.owner_name}_网页源码.zip`, () => {
                fs.rmSync(tmpDir, { recursive: true, force: true });
                fs.unlinkSync(zipPath);
            });
        });
    } catch (error) {
        res.status(500).json({ error: '导出失败' });
    }
});

// 直接下载HTML文件
router.get('/html/:projectId', async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project || !project.generated_html) {
            return res.status(404).json({ error: '网页不存在' });
        }
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="Dear_${project.owner_name}.html"`);
        res.send(project.generated_html);
    } catch (error) {
        res.status(500).json({ error: '下载失败' });
    }
});

module.exports = router;