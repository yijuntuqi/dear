const axios = require('axios');

async function callAI(messages, maxTokens = 2000) {
    try {
        const response = await axios.post(
            process.env.CHATANYWHERE_API_URL,
            {
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.8,
                max_tokens: maxTokens
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.CHATANYWHERE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.log('ChatAnywhere 失败，切换到 Kimi...');
        try {
            const kimiResponse = await axios.post(
                `${process.env.KIMI_BASE_URL}/chat/completions`,
                {
                    model: process.env.KIMI_MODEL,
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: maxTokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            return kimiResponse.data.choices[0].message.content;
        } catch (kimiError) {
            throw new Error('所有AI服务暂时不可用');
        }
    }
}

// AI生成故事内容
async function generateContent(ownerName, relationship, theme) {
    const relationshipMap = {
        parent: '父母',
        lover: '伴侣',
        friend: '朋友',
        teacher: '老师'
    };
    
    const messages = [
        {
            role: "system",
            content: `你是一位情感细腻的作家，擅长用温暖的文字帮人表达对${relationshipMap[relationship] || '重要的人'}的爱与感恩。`
        },
        {
            role: "user",
            content: `请帮我想一段写给${relationshipMap[relationship] || '重要的人'}「${ownerName}」的话，主题风格是「${theme}」。
            请包含：
            1. 一个温暖的相识故事（150字左右）
            2. 一个难忘的瞬间（150字左右）
            3. 一段想对TA说的话（200字左右）
            请用JSON格式返回：
            {
              "stories": [{"title": "...", "content": "..."}, {"title": "...", "content": "..."}],
              "message": "...",
              "suggestions": ["建议1", "建议2"]
            }`
        }
    ];
    
    const response = await callAI(messages);
    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
        return { rawResponse: response };
    }
}

// AI对话定制
async function aiChat(userMessage, context) {
    const messages = [
        {
            role: "system",
            content: `你是一位网页定制专家，帮用户定制一个送给他人的专属纪念网页。
            当前网页信息：${JSON.stringify(context)}
            你需要理解用户的想法，给出具体的修改建议和实现方案。
            回答要温暖、专业，给出可操作的建议。`
        },
        {
            role: "user",
            content: userMessage
        }
    ];
    
    return await callAI(messages, 1000);
}

// AI生成配色方案
async function generateColorScheme(description, mood) {
    const messages = [
        {
            role: "system",
            content: "你是一位设计师，擅长根据情感和描述生成网页配色方案。"
        },
        {
            role: "user",
            content: `请根据以下描述生成网页配色方案：
            描述：${description}
            情感氛围：${mood}
            请返回JSON格式：
            {
              "primary": "#颜色",
              "secondary": "#颜色",
              "background": "#颜色",
              "text": "#颜色",
              "accent": "#颜色",
              "name": "方案名称"
            }`
        }
    ];
    
    const response = await callAI(messages);
    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
        return null;
    }
}

module.exports = { callAI, generateContent, aiChat, generateColorScheme };