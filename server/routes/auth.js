const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userDB } = require('../lib/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dear-secret';

// 注册
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: '请填写邮箱和密码' });
        }
        
        const existing = await userDB.findByEmail(email);
        if (existing) {
            return res.status(400).json({ error: '该邮箱已注册' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await userDB.createUser(email, passwordHash);
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({ success: true, user, token });
    } catch (error) {
        res.status(500).json({ error: '注册失败' });
    }
});

// 登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await userDB.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }
        
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({
            success: true,
            user: { id: user.id, email: user.email, plan_type: user.plan_type },
            token
        });
    } catch (error) {
        res.status(500).json({ error: '登录失败' });
    }
});

// 获取用户信息
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: '未登录' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await userDB.getUser(decoded.userId);
        
        if (!user) return res.status(404).json({ error: '用户不存在' });
        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ error: 'token无效' });
    }
});

module.exports = router;