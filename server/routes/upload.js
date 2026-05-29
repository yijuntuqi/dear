const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { projectDB } = require('../lib/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dear-secret';

// 确保上传目录存在
const photosDir = path.join(__dirname, '..', 'uploads', 'photos');
const audioDir = path.join(__dirname, '..', 'uploads', 'audio');
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = file.fieldname === 'photos' ? photosDir : audioDir;
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'photos') {
            const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
            if (allowed.test(path.extname(file.originalname))) {
                cb(null, true);
            } else {
                cb(new Error('仅支持 JPG/PNG/GIF/WEBP 格式'));
            }
        } else {
            const allowed = /\.(mp3|wav|m4a)$/i;
            if (allowed.test(path.extname(file.originalname))) {
                cb(null, true);
            } else {
                cb(new Error('仅支持 MP3/WAV/M4A 格式'));
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
            uploadedAt: new Date()
        }));
        
        const allAudio = [...existingAudio, ...newAudio].slice(0, 3);
        await projectDB.update(req.params.projectId, { uploadedAudio: allAudio });
        
        res.json({ success: true, audio: allAudio, added: newAudio.length });
    } catch (error) {
        res.status(500).json({ error: '上传失败' });
    }
});

module.exports = router;