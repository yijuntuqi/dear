const express = require('express');
const jwt = require('jsonwebtoken');
const { projectDB, userDB } = require('../lib/db');
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

// AI生成内容（VIP专属）
router.post('/generate-content', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { ownerName, relationship, theme } = req.body;
        const content = await generateContent(ownerName, relationship, theme);
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ error: 'AI生成失败' });
    }
});

// AI对话定制（VIP专属）
router.post('/chat', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { projectId, message } = req.body;
        
        const project = await projectDB.getById(projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        // 构建上下文
        const context = {
            ownerName: project.owner_name,
            relationship: project.relationship,
            theme: project.theme,
            currentContent: {
                stories: project.stories,
                message: project.message
            }
        };
        
        // 构建对话消息
        const conversationHistory = project.ai_conversation || [];
        const messages = [
            {
                role: "system",
                content: `你是一位专业的网页定制顾问，帮用户定制一个送给${context.ownerName}（关系：${context.relationship}）的专属纪念网页。
当前网页主题：${context.theme}
已有内容：${JSON.stringify(context.currentContent)}

你的任务是：
1. 理解用户的想法和需求
2. 给出专业的建议（风格、配色、内容、布局等）
3. 引导用户表达更多细节
4. 当用户满意时，可以帮他生成完整的网页内容

请用温暖、专业的语气回复。每次回复不要太长，像朋友聊天一样。`
            }
        ];
        
        // 添加历史对话
        for (const msg of conversationHistory.slice(-10)) {
            messages.push({ role: msg.role, content: msg.content });
        }
        
        // 添加当前用户消息
        messages.push({ role: "user", content: message });
        
        const reply = await require('../lib/ai').callAI(messages, 1500);
        
        // 保存对话历史
        conversationHistory.push({ role: 'user', content: message, time: new Date() });
        conversationHistory.push({ role: 'assistant', content: reply, time: new Date() });
        
        await projectDB.update(projectId, { aiConversation: conversationHistory });
        
        res.json({ success: true, reply, conversation: conversationHistory });
    } catch (error) {
        console.error('AI对话失败:', error);
        res.status(500).json({ error: 'AI对话失败' });
    }
});

// AI根据对话历史生成最终内容
router.post('/apply-suggestions', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { projectId } = req.body;
        
        const project = await projectDB.getById(projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const conversationHistory = project.ai_conversation || [];
        const conversationText = conversationHistory
            .map(msg => `[${msg.role}]: ${msg.content}`)
            .join('\n');
        
        const messages = [
            {
                role: "system",
                content: `根据用户的对话历史，生成最终的网页内容。
请返回JSON格式：
{
  "stories": [{"title": "故事标题", "content": "故事内容"}],
  "message": "想对TA说的话",
  "colorScheme": {"primary": "#颜色", "secondary": "#颜色", "name": "方案名"},
  "suggestions": ["还可以优化的建议"]
}`
            },
            {
                role: "user",
                content: `对话历史：\n${conversationText}\n\n请根据以上对话生成最终内容。`
            }
        ];
        
        const reply = await require('../lib/ai').callAI(messages, 2000);
        
        let generatedContent = {};
        try {
            const jsonMatch = reply.match(/\{[\s\S]*\}/);
            if (jsonMatch) generatedContent = JSON.parse(jsonMatch[0]);
        } catch (e) {
            generatedContent = { rawResponse: reply };
        }
        
        // 保存生成的内容到项目
        if (generatedContent.stories) {
            await projectDB.update(projectId, { stories: generatedContent.stories });
        }
        if (generatedContent.message) {
            await projectDB.update(projectId, { message: generatedContent.message });
        }
        if (generatedContent.colorScheme) {
            await projectDB.update(projectId, { colorScheme: generatedContent.colorScheme });
        }
        
        res.json({ success: true, content: generatedContent });
    } catch (error) {
        console.error('应用AI建议失败:', error);
        res.status(500).json({ error: '应用失败' });
    }
});

// AI生成配色方案
router.post('/generate-colors', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { description, mood } = req.body;
        const colorScheme = await generateColorScheme(description, mood);
        res.json({ success: true, colorScheme });
    } catch (error) {
        res.status(500).json({ error: '配色生成失败' });
    }
});

// 获取对话历史
router.get('/conversation/:projectId', authMiddleware, async (req, res) => {
    try {
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        res.json({ success: true, conversation: project.ai_conversation || [] });
    } catch (error) {
        res.status(500).json({ error: '获取对话历史失败' });
    }
});

module.exports = router;