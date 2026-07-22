const express = require('express');
const jwt = require('jsonwebtoken');
const { projectDB, userDB } = require('../lib/db');
const { callAI, generateContent, aiChat, generateColorScheme } = require('../lib/ai');
const { renderPage } = require('../lib/renderer');

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
            return res.status(403).json({ error: '此功能需要VIP或MVP会员，请先升级' });
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
        
        // 【关键】构建完整的上下文：包含用户已填写的所有信息
        const context = {
            // 基本信息（Step1）
            ownerName: project.owner_name,
            relationship: project.relationship,
            theme: project.theme,
            basicInfo: project.basic_info || {},
            
            // 已填写的内容（Step2）
            currentStories: project.stories || [],
            currentMessage: project.message || '',
            
            // 模板信息
            templateInfo: {
                hasStoriesSection: true,
                hasMessageSection: true,
                hasTimelineSection: false,  // 默认没有，AI可以要求加
                hasPhotoWall: false,
                hasAudioPlayer: false
            },
            
            // 关系中文映射
            relationshipLabel: {
                parent: '父母',
                lover: '伴侣',
                friend: '朋友',
                teacher: '老师',
                family: '亲人',
                grandparent: '爷爷奶奶',
                sibling: '兄弟姐妹',
                uncle: '叔叔/舅舅',
                aunt: '阿姨/姑姑',
                cousin: '堂/表亲'
            }[project.relationship] || '重要的人'
        };
        
        // 构建对话消息
        const conversationHistory = project.ai_conversation || [];
        const messages = [
            {
                role: "system",
                content: `你是一位网页定制顾问，帮助用户完善一个送给「${context.ownerName}」（${context.relationshipLabel}）的专属纪念网页。

## 当前网页状态：
- 主题模板：${context.theme}
- 已有故事（${context.currentStories.length}个）：${JSON.stringify(context.currentStories)}
- 想说的话：${context.currentMessage || '（未填写）'}

## 网页模板包含的板块：
1. 封面区：显示TA的名字和献词
2. 故事区：展示用户和TA的故事
3. 留言区：想对TA说的话
4. 签名区：用户署名+日期
5. 进度条区（可选）：显示相识时间计时器
6. 照片墙（可选）：展示上传的照片

## 你的任务：
1. 理解用户的新需求
2. 基于已有内容，给出修改建议或新增内容
3. 如果用户要求加进度条，询问相识日期和想要的文案
4. 如果用户要求加照片墙，提醒这是VIP功能需要上传照片
5. 回复要温暖、专业，像朋友聊天一样

## 重要：
- 不要覆盖用户已有的故事和留言
- 只在用户明确要求时才修改已有内容
- 新增的内容要符合原来的风格和语气`
            }
        ];
        
        // 添加历史对话（最近10轮）
        for (const msg of conversationHistory.slice(-20)) {
            messages.push({ role: msg.role, content: msg.content });
        }
        
        // 添加当前用户消息
        messages.push({ role: "user", content: message });
        
        const reply = await require('../lib/ai').callAI(messages, 1500);
        
        // 保存对话历史
        conversationHistory.push({ role: 'user', content: message, time: new Date().toISOString() });
        conversationHistory.push({ role: 'assistant', content: reply, time: new Date().toISOString() });
        
        await projectDB.update(projectId, { aiConversation: conversationHistory });
        
        res.json({ success: true, reply, conversation: conversationHistory });
    } catch (error) {
        console.error('AI对话失败:', error);
        res.status(500).json({ error: 'AI对话失败' });
    }
});

// AI根据对话历史生成最终完整HTML
router.post('/apply-suggestions', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { projectId } = req.body;
        
        const project = await projectDB.getById(projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        // 直接引用 AI 模块
        const aiModule = require('../lib/ai');
        
        // 1. 获取基础模板HTML
        const baseTemplate = await renderPage(project);
        
        // 2. 获取对话历史
        const conversationHistory = project.ai_conversation || [];
        
        // 3. 构建Prompt
        const prompt = `你是一个专业的网页设计师。请生成一个完整的纪念网页HTML。

## 基础模板（参考此模板的结构和样式）：
\`\`\`html
${baseTemplate}
\`\`\`

## 用户信息：
- 被纪念者：${project.owner_name}
- 关系：${project.relationship}
- 故事：${JSON.stringify(project.stories || [])}
- 留言：${project.message || ''}
- 署名：${project.basic_info?.authorName || '爱你的人'}

## 对话历史（用户的所有额外要求）：
${JSON.stringify(conversationHistory)}

## 要求：
1. 基于模板修改，保留基本结构
2. 根据对话历史添加用户要求的内容
3. 不要丢失已有的故事、留言、署名
4. 输出完整HTML，直接可浏览器打开
5. 只输出HTML代码，不要任何解释`;

        // 调用AI
        const html = await aiModule.callAI([{ role: 'user', content: prompt }], 4000);
        
        // 清理
        let cleanHtml = html.replace(/^```html\s*/i, '').replace(/\s*```$/, '').trim();
        
        // 保存到数据库
        await projectDB.update(projectId, {
            generatedHtml: cleanHtml,
            status: 'completed'
        });
        
        res.json({ success: true, html: cleanHtml });
    } catch (error) {
        console.error('应用AI建议失败:', error);
        res.status(500).json({ error: '生成失败: ' + error.message });
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