const express = require('express');
const jwt = require('jsonwebtoken');
const { projectDB } = require('../lib/db');
const { generateContent, aiChat, generateColorScheme } = require('../lib/ai');

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

function vipMiddleware(req, res, next) {
    userDB.getUser(req.userId).then(user => {
        if (!user || user.plan_type === 'free') {
            return res.status(403).json({ error: '此功能需要VIP会员，请先升级' });
        }
        next();
    });
}

// AI生成内容需要VIP
router.post('/generate-content', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { ownerName, relationship, theme } = req.body;
        const content = await generateContent(ownerName, relationship, theme);
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: 'AI生成失败' });
    }
});

// AI对话需要VIP
router.post('/chat', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { projectId, message } = req.body;
        
        const project = await projectDB.getById(projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const context = {
            ownerName: project.owner_name,
            relationship: project.relationship,
            theme: project.theme,
            currentContent: {
                stories: project.stories,
                message: project.message
            }
        };
        
        const reply = await aiChat(message, context);
        
        // 保存对话历史
        const conversation = project.ai_conversation || [];
        conversation.push({ role: 'user', content: message, time: new Date() });
        conversation.push({ role: 'assistant', content: reply, time: new Date() });
        
        await projectDB.update(projectId, { aiConversation: conversation });
        
        res.json({ success: true, reply, conversation });
    } catch (error) {
        res.status(500).json({ error: 'AI对话失败' });
    }
});

// AI生成配色
router.post('/generate-colors', authMiddleware, async (req, res) => {
    try {
        const { description, mood } = req.body;
        const colorScheme = await generateColorScheme(description, mood);
        res.json({ success: true, colorScheme });
    } catch (error) {
        res.status(500).json({ error: '配色生成失败' });
    }
});

module.exports = router;