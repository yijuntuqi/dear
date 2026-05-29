const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { projectDB } = require('../lib/db');

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

// 配置存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = file.fieldname === 'photos' ? 'uploads/photos' : 'uploads/audio';
        cb(null, path.join(__dirname, '..', type));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 20
    },
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'photos') {
            const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
            if (allowed.test(path.extname(file.originalname))) {
                cb(null, true);
            } else {
                cb(new Error('仅支持 JPG/PNG/GIF/WEBP 格式图片'));
            }
        } else if (file.fieldname === 'audio') {
            const allowed = /\.(mp3|wav|m4a)$/i;
            if (allowed.test(path.extname(file.originalname))) {
                cb(null, true);
            } else {
                cb(new Error('仅支持 MP3/WAV/M4A 格式音频'));
            }
        }
    }
});

// 上传照片
router.post('/photos/:projectId', authMiddleware, upload.array('photos', 20), async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const existingPhotos = project.uploaded_photos || [];
        const newPhotos = req.files.map(f => ({
            url: '/uploads/photos/' + f.filename,
            name: f.originalname,
            size: f.size,
            uploadedAt: new Date()
        }));
        
        const allPhotos = [...existingPhotos, ...newPhotos].slice(0, 20);
        await projectDB.update(req.params.projectId, { uploadedPhotos: allPhotos });
        
        res.json({ success: true, photos: allPhotos, added: newPhotos.length });
    } catch (error) {
        res.status(500).json({ error: '上传失败' });
    }
});

// 上传音频
router.post('/audio/:projectId', authMiddleware, upload.array('audio', 3), async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const existingAudio = project.uploaded_audio || [];
        const newAudio = req.files.map(f => ({
            url: '/uploads/audio/' + f.filename,
            name: f.originalname,
            size: f.size,
            uploadedAt: new Date()
        }));
        
        const allAudio = [...existingAudio, ...newAudio].slice(0, 3);
        await projectDB.update(req.params.projectId, { uploadedAudio: allAudio });
        
        res.json({ success: true, audio: allAudio, added: newAudio.length });
    } catch (error) {
        res.status(500).json({ error: '上传失败' });
    }
});

// 删除照片
router.delete('/photos/:projectId/:index', authMiddleware, async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        const photos = (project.uploaded_photos || []).filter((_, i) => i !== parseInt(req.params.index));
        await projectDB.update(req.params.projectId, { uploadedPhotos: photos });
        res.json({ success: true, photos });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
});

module.exports = router;