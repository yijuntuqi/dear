import { useState } from 'react';
import { aiAPI } from '../utils/api';
import './StepContent.css';

// 1. 在参数中接收 projectType
function StepContent({ formData, updateForm, onBack, onCreate, projectType }) {
    const [aiLoading, setAiLoading] = useState(false);
    
    const addStory = () => {
        const stories = [...(formData.stories || []), { title: '', content: '' }];
        updateForm('stories', stories);
    };
    
    const removeStory = (index) => {
        const stories = formData.stories.filter((_, i) => i !== index);
        updateForm('stories', stories);
    };
    
    const updateStory = (index, field, value) => {
        const stories = [...formData.stories];
        stories[index][field] = value;
        updateForm('stories', stories);
    };
    
    const handleAIGenerate = async () => {
        // 如果是免费创建，禁止使用AI
        if (projectType === 'free') {
            if (window.confirm('AI生成是VIP专属功能。是否升级到VIP（¥29.9）？')) {
                window.location.href = '/upgrade';
            }
            return;
        }
        
        // VIP创建才能使用AI
        setAiLoading(true);
        try {
            const result = await aiAPI.generateContent(
                formData.ownerName,
                formData.relationship,
                formData.theme
            );
            if (result.content) {
                if (result.content.stories) updateForm('stories', result.content.stories);
                if (result.content.message) updateForm('message', result.content.message);
                alert('AI内容生成成功！');
            }
        } catch (err) {
            alert('AI生成失败：' + err.message);
        } finally {
            setAiLoading(false);
        }
    };
    
    const canCreate = formData.stories?.some(s => s.title && s.content) || formData.message;
    
    return (
        <div className="step-content-page">
            <h2>✍️ 第二步：填写内容</h2>
            <p className="step-desc">写下你们的故事，或者让AI帮你生成</p>
            
            <button
                className="btn btn-secondary ai-btn"
                onClick={handleAIGenerate}
                disabled={aiLoading}
            >
                {aiLoading ? '🤖 AI生成中...' : '🤖 让AI帮我生成内容（VIP功能）'}
            </button>
            
            <div className="form-group">
                <label>📖 我们的故事</label>
                {formData.stories?.map((story, index) => (
                    <div key={index} className="story-item">
                        <input
                            type="text"
                            value={story.title}
                            onChange={e => updateStory(index, 'title', e.target.value)}
                            placeholder={`故事 ${index + 1} 标题`}
                        />
                        <textarea
                            value={story.content}
                            onChange={e => updateStory(index, 'content', e.target.value)}
                            placeholder={`故事 ${index + 1} 内容...`}
                            rows={4}
                        />
                        {formData.stories.length > 1 && (
                            <button className="btn-remove" onClick={() => removeStory(index)}>
                                ✕ 删除此故事
                            </button>
                        )}
                    </div>
                ))}
                <button className="btn-add-story" onClick={addStory}>
                    + 添加更多故事
                </button>
            </div>
            
            <div className="form-group">
                <label>💌 想对TA说的话</label>
                <textarea
                    value={formData.message || ''}
                    onChange={e => updateForm('message', e.target.value)}
                    placeholder="写下你最想对TA说的话..."
                    rows={6}
                />
            </div>
            
            <div className="step-actions">
                <button className="btn btn-secondary" onClick={onBack}>
                    ← 返回上一步
                </button>
                <button className="btn btn-primary" onClick={onCreate} disabled={!canCreate}>
                    生成网页 → 
                </button>
            </div>
        </div>
    );
}

export default StepContent;