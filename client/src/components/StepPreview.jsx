import { useState, useEffect } from 'react';
import './StepPreview.css';

function StepPreview({ project, onBack, onRender }) {
    const [previewHtml, setPreviewHtml] = useState('');
    
    useEffect(() => {
        // 构建预览HTML
        const html = generatePreviewHTML(project);
        setPreviewHtml(html);
    }, [project]);
    
    return (
        <div className="step-preview">
            <h2>👁️ 第三步：预览确认</h2>
            <p className="step-desc">确认无误后即可生成最终网页</p>
            
            <div className="preview-container">
                <div className="preview-frame">
                    <iframe
                        srcDoc={previewHtml}
                        title="网页预览"
                        sandbox="allow-same-origin"
                    />
                </div>
            </div>
            
            <div className="project-info card">
                <h3>📋 页面信息</h3>
                <p><strong>送给：</strong>{project.owner_name}</p>
                <p><strong>关系：</strong>{project.relationship}</p>
                <p><strong>主题：</strong>{project.theme}</p>
                <p><strong>故事数量：</strong>{project.stories?.length || 0} 个</p>
            </div>
            
            <div className="step-actions">
                <button className="btn btn-secondary" onClick={onBack}>
                    ← 返回修改
                </button>
                <button className="btn btn-primary" onClick={onRender}>
                    确认生成 → 
                </button>
            </div>
        </div>
    );
}

// 简化的预览HTML生成（不需要完整EJS渲染）
function generatePreviewHTML(project) {
    const relationshipMap = {
        parent: '亲爱的爸爸/妈妈',
        grandparent: '致最敬爱的爷爷奶奶',
        sibling: '致最亲爱的兄弟姐妹',
        lover: '我最爱的人',
        friend: '我最好的朋友',
        teacher: '敬爱的老师',
        family: '致最亲的人',
        uncle: '致亲爱的叔叔/舅舅',
        aunt: '致亲爱的阿姨/姑姑',
        cousin: '致亲爱的兄弟姐妹'
    };
    
    return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
                    background: linear-gradient(135deg, #fff5f7, #ffe0e6);
                    color: #4a4a4a;
                    padding: 20px;
                    text-align: center;
                }
                h1 { font-size: 2em; color: #ff6b8a; margin: 30px 0; }
                .relation { color: #999; font-size: 1.1em; margin-bottom: 20px; }
                .story {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    margin: 15px 0;
                    text-align: left;
                }
                .story h3 { color: #ff6b8a; }
                .message {
					background: linear-gradient(135deg, #ff6b8a, #ffa3b5);
					color: white;
					padding: 30px;
					border-radius: 15px;
					margin: 20px 0;
					text-align: left;
					white-space: pre-wrap;
				}
                .footer { color: #999; margin-top: 30px; }
            </style>
        </head>
        <body>
            <h1>${project.owner_name}</h1>
            <p class="relation">${relationshipMap[project.relationship] || '重要的人'}</p>
            ${project.stories?.map(s => `
                <div class="story">
                    <h3>${s.title}</h3>
                    <p>${s.content}</p>
                </div>
            `).join('') || ''}
            ${project.message ? `
                <div class="message">
                    <p>${project.message}</p>
                </div>
            ` : ''}
            <p class="footer">Made with ❤️ by Dear</p>
        </body>
        </html>
    `;
}

export default StepPreview;