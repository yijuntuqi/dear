import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiAPI, projectAPI } from '../utils/api';
import BackButton from '../components/BackButton';
import './AIChat.css';

function AIChat() {
    const location = useLocation();
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    
    const projectId = location.state?.projectId;
    const ownerName = location.state?.ownerName || 'TA';
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    
    // 关系映射（用于显示中文）
    const relationshipMap = {
        parent: '父母/子女',
        lover: '伴侣',
        friend: '朋友',
        teacher: '老师',
        family: '亲人'
    };
    
    // 主题映射
    const themeMap = {
        parent: '温馨亲情',
        lover: '浪漫爱情',
        friend: '真挚友情',
        teacher: '庄重师恩',
        family: '温暖亲人'
    };
    
    // 加载项目数据并构建欢迎消息
    const loadProjectAndBuildWelcome = async () => {
        try {
            const result = await projectAPI.get(projectId);
            const p = result.project;
            
            // 构建故事信息
            let storiesText = '';
            if (p.stories && p.stories.length > 0) {
                const storyTitles = p.stories.map(s => `《${s.title}》`).join('、');
                storiesText = `\n\n📖 你之前写了 ${p.stories.length} 个故事：${storyTitles}`;
            }
            
            // 构建留言信息
            let messageText = '';
            if (p.message) {
                const shortMsg = p.message.length > 50 ? p.message.substring(0, 50) + '...' : p.message;
                messageText = `\n\n💌 你想对TA说的话：${shortMsg}`;
            }
            
            // 构建署名信息
            let authorText = '';
            if (p.basic_info?.authorName) {
                authorText = `\n\n✍️ 署名：${p.basic_info.authorName}`;
            }
            
            // 构建完整的欢迎消息
            const welcomeMsg = `你好！👋 我来帮你为 **${p.owner_name}** 定制一个独一无二的纪念网页。

我看到了你之前填写的信息：
• 💝 被纪念者：${p.owner_name}
• 👥 关系：${relationshipMap[p.relationship] || p.relationship}
• 🎨 主题：${themeMap[p.theme] || p.theme}${storiesText}${messageText}${authorText}

---

现在你可以告诉我：
• 想要什么风格的感觉？（温馨、浪漫、活泼、庄重...）
• 想加什么特别的内容？（比如相识时间进度条、照片墙、音乐播放器等）
• 有什么想修改的文字或故事？

说说你的想法，我来帮你实现！💝`;
            
            setMessages([{
                role: 'assistant',
                content: welcomeMsg
            }]);
            
            // 保存欢迎消息到对话历史（可选）
            // await aiAPI.saveConversation(projectId, [{ role: 'assistant', content: welcomeMsg }]);
            
        } catch (err) {
            console.error('加载项目失败:', err);
            // 降级：简单的欢迎消息
            setMessages([{
                role: 'assistant',
                content: `你好！👋 我来帮你为 **${ownerName}** 定制一个独一无二的纪念网页。

你可以告诉我：
• 你想要什么风格的感觉？
• 有没有特别的回忆或故事想突出？
• 喜欢什么颜色？

或者直接说你想怎么改，我会一步步帮你完成！💝`
            }]);
        }
    };
    
    // 加载历史对话（如果有）
    const loadConversation = async () => {
        try {
            const result = await aiAPI.getConversation(projectId);
            if (result.conversation && result.conversation.length > 0) {
                setMessages(result.conversation);
                return true;
            }
            return false;
        } catch (err) {
            console.error('加载对话失败:', err);
            return false;
        }
    };
    
    useEffect(() => {
        if (!projectId) {
            navigate('/dashboard');
            return;
        }
        
        // 先尝试加载历史对话，如果没有则构建欢迎消息
        const initChat = async () => {
            const hasHistory = await loadConversation();
            if (!hasHistory) {
                await loadProjectAndBuildWelcome();
            }
        };
        
        initChat();
    }, [projectId]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;
        
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setLoading(true);
        
        try {
            const result = await aiAPI.chat(projectId, text);
            setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
        } catch (err) {
            console.error('AI对话失败:', err);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: '抱歉，AI服务暂时不可用，请稍后再试。' 
            }]);
        } finally {
            setLoading(false);
        }
    };
    
    const handleApplySuggestions = async () => {
        setApplying(true);
        try {
            const result = await aiAPI.applySuggestions(projectId);
            if (result.content) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '✅ 已根据我们的对话生成了最终内容！\n\n正在跳转到预览页面...'
                }]);
                
                // 跳转到预览确认页
                setTimeout(() => {
                    navigate(`/preview-confirm/${projectId}`);
                }, 1500);
            }
        } catch (err) {
            alert('应用失败：' + err.message);
        } finally {
            setApplying(false);
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    return (
        <div className="ai-chat-page">
            <BackButton to="/dashboard" label="返回项目" />
            
            <div className="ai-chat-container">
                <div className="ai-chat-header">
                    <h2>🤖 AI定制助手</h2>
                    <p>正在为 <strong>{ownerName}</strong> 定制专属网页</p>
                </div>
                
                <div className="ai-chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-bubble ${msg.role}`}>
                            <div className="chat-avatar">
                                {msg.role === 'assistant' ? '🤖' : '👤'}
                            </div>
                            <div className="chat-content">
                                {msg.content.split('\n').map((line, j) => (
                                    <span key={j}>
                                        {line}
                                        {j < msg.content.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble assistant">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-content typing">
                                <span className="dot" />
                                <span className="dot" />
                                <span className="dot" />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                
                <div className="ai-chat-input-area">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="描述你的想法，比如：我希望风格更温馨一点..."
                        rows={2}
                        disabled={loading}
                    />
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                    >
                        发送
                    </button>
                </div>
                
                {messages.length > 2 && (
                    <div className="ai-chat-actions">
                        <button 
                            className="btn btn-primary"
                            onClick={handleApplySuggestions}
                            disabled={applying}
                        >
                            {applying ? '⏳ 正在生成...' : '✨ 应用AI建议，生成网页'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AIChat;