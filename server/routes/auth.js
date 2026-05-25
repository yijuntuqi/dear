const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userDB } = require('../lib/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dear-secret';

// 手机号校验
function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
}

// 邮箱校验
function isValidEmail(email) {
    if (!email) return true; // 邮箱可选，空值允许
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 注册
router.post('/register', async (req, res) => {
    try {
        const { nickname, phone, email, password } = req.body;
        
        // 校验必填字段
        if (!nickname || !nickname.trim()) {
            return res.status(400).json({ error: '请输入昵称' });
        }
        if (!phone) {
            return res.status(400).json({ error: '请输入手机号' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ error: '密码至少6位' });
        }
        
        // 校验手机号格式
        if (!isValidPhone(phone)) {
            return res.status(400).json({ error: '请输入正确的11位手机号' });
        }
        
        // 校验邮箱格式
        if (email && !isValidEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }
        
        // 检查昵称唯一性
        const existingNickname = await userDB.findByNickname(nickname.trim());
        if (existingNickname) {
            return res.status(400).json({ error: '该昵称已被使用' });
        }
        
        // 检查手机号唯一性
        const existingPhone = await userDB.findByPhone(phone);
        if (existingPhone) {
            return res.status(400).json({ error: '该手机号已注册' });
        }
        
        // 检查邮箱唯一性（如果填写了邮箱）
        if (email) {
            const existingEmail = await userDB.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ error: '该邮箱已注册' });
            }
        }
        
        // 加密密码并创建用户
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await userDB.createUser(
            nickname.trim(),
            phone,
            email?.trim() || null,
            passwordHash
        );
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({ success: true, user, token });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败，请稍后再试' });
    }
});

// 登录（手机号 + 密码）
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        if (!phone || !password) {
            return res.status(400).json({ error: '请输入手机号和密码' });
        }
        
        const user = await userDB.findByPhone(phone);
        if (!user) {
            return res.status(401).json({ error: '手机号或密码错误' });
        }
        
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: '手机号或密码错误' });
        }
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
        
        res.json({
            success: true,
            user: {
                id: user.id,
                nickname: user.nickname,
                phone: user.phone,
                email: user.email,
                plan_type: user.plan_type
            },
            token
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败，请稍后再试' });
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