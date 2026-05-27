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

// AI根据对话历史生成最终内容
router.post('/apply-suggestions', authMiddleware, vipMiddleware, async (req, res) => {
    try {
        const { projectId } = req.body;
        
        const project = await projectDB.getById(projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        
        const conversationHistory = project.ai_conversation || [];
        
        // 提取对话中用户提到的关键信息
        const conversationText = conversationHistory
            .map(msg => `[${msg.role}]: ${msg.content}`)
            .join('\n');
        
        const messages = [
            {
                role: "system",
                content: `你是一个内容生成助手。根据对话历史，输出最终的网页内容JSON。

## 已有内容（不要丢失）：
- 故事：${JSON.stringify(project.stories || [])}
- 留言：${JSON.stringify(project.message || '')}
- 基本信息：${JSON.stringify(project.basic_info || {})}

## 任务：
根据对话历史中用户的新需求，修改/新增内容。

## 对话历史中可能包含的需求：
- "加进度条" → 在basicInfo中添加 meetDate 和 timelineLabel
- "修改故事内容" → 修改stories数组
- "改留言" → 修改message
- "改配色" → 添加colorScheme

## 返回JSON格式：
{
  "stories": [...],        // 最终的故事列表
  "message": "...",        // 最终的留言
  "basicInfo": {           // 基本信息（合并新需求）
    "meetDate": "2020-01-01",    // 如果用户提到了相识日期
    "timelineLabel": "..."       // 进度条文案
  },
  "colorScheme": {...}     // 如果用户提到了配色
}

## 重要：
1. 保留原有内容，只在用户明确要求时才修改
2. 进度条的meetDate从对话中提取，格式YYYY-MM-DD
3. timelineLabel如果用户没指定，用默认的"和你相识后的每一秒我都感到幸福"`
            },
            {
                role: "user",
                content: `对话历史：\n${conversationText}\n\n请输出最终的网页内容JSON。`
            }
        ];
        
        const reply = await require('../lib/ai').callAI(messages, 2000);
        
        // 解析AI返回的JSON
        let generatedContent = {};
        try {
            const jsonMatch = reply.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                generatedContent = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('JSON解析失败:', e);
            return res.status(500).json({ error: 'AI返回格式异常，请重试' });
        }
        
        // 合并更新项目数据
        const updateData = {};
        
        if (generatedContent.stories && generatedContent.stories.length > 0) {
            updateData.stories = generatedContent.stories;
        }
        if (generatedContent.message) {
            updateData.message = generatedContent.message;
        }
        if (generatedContent.basicInfo) {
            updateData.basicInfo = {
                ...project.basic_info,
                ...generatedContent.basicInfo
            };
        }
        if (generatedContent.colorScheme) {
            updateData.colorScheme = generatedContent.colorScheme;
        }
        
        await projectDB.update(projectId, updateData);
        
        res.json({ 
            success: true, 
            content: generatedContent,
            message: '内容已更新，请预览网页'
        });
    } catch (error) {
        console.error('应用AI建议失败:', error);
        res.status(500).json({ error: '应用失败: ' + error.message });
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