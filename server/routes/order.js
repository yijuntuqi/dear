const express = require('express');
const jwt = require('jsonwebtoken');
const { orderDB, userDB } = require('../lib/db');

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

// 创建订单
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { planType, amount, projectId } = req.body;
        const order = await orderDB.create(req.userId, projectId, planType, amount);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ error: '创建订单失败' });
    }
});

// 获取用户订单
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const orders = await orderDB.getUserOrders(req.userId);
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: '获取订单失败' });
    }
});

module.exports = router;