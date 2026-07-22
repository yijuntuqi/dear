import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { aiAPI, projectAPI } from '../utils/api';
import BackButton from '../components/BackButton';
import './AIChat.css';

function AIChat() {
    const location = useLocation();
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const photoInputRef = useRef(null);
    const audioInputRef = useRef(null);
    
    const projectId = location.state?.projectId;
    const ownerName = location.state?.ownerName || 'TA';
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [uploadedAudio, setUploadedAudio] = useState([]);
    
    const relationshipMap = {
        parent: '父母/子女', lover: '伴侣', friend: '朋友',
        teacher: '老师', family: '亲人', grandparent: '爷爷奶奶',
        sibling: '兄弟姐妹', uncle: '叔叔/舅舅', aunt: '阿姨/姑姑', cousin: '堂/表亲'
    };
    
    const themeMap = {
        parent: '温馨亲情', lover: '浪漫爱情', friend: '真挚友情',
        teacher: '庄重师恩', family: '温暖亲人'
    };
    
    const loadProjectAndBuildWelcome = async () => {
        try {
            const result = await projectAPI.get(projectId);
            const p = result.project;
            
            if (p.uploaded_photos) setUploadedPhotos(p.uploaded_photos);
            if (p.uploaded_audio) setUploadedAudio(p.uploaded_audio);
            
            let storiesText = '';
            if (p.stories?.length > 0) {
                storiesText = '\n\n📖 你之前写了 ' + p.stories.length + ' 个故事：' +
                    p.stories.map(s => '《' + s.title + '》').join('、');
            }
            
            let messageText = '';
            if (p.message) {
                const short = p.message.length > 50 ? p.message.substring(0, 50) + '...' : p.message;
                messageText = '\n\n💌 你想对TA说的话：' + short;
            }
            
            let mediaText = '';
            if (uploadedPhotos.length > 0) mediaText += '\n\n📷 已上传 ' + uploadedPhotos.length + ' 张照片';
            if (uploadedAudio.length > 0) mediaText += '\n\n🎵 已上传 ' + uploadedAudio.length + ' 个音频';
            
            const welcomeMsg = '你好！👋 我来帮你为 **' + p.owner_name + '** 定制专属网页。' +
                '\n\n我看到了你填写的信息：' +
                '\n• 💝 被纪念者：' + p.owner_name +
                '\n• 👥 关系：' + (relationshipMap[p.relationship] || p.relationship) +
                '\n• 🎨 主题：' + (themeMap[p.theme] || p.theme) +
                storiesText + messageText + mediaText +
                '\n\n---\n\n你可以告诉我想要什么风格、加什么内容，或者上传照片和音频！💝';
            
            setMessages([{ role: 'assistant', content: welcomeMsg }]);
        } catch (err) {
            setMessages([{ role: 'assistant', content: '你好！👋 我来帮你为 **' + ownerName + '** 定制专属网页。\n\n你可以告诉我想要什么风格、加什么内容，或者上传照片和音频！💝' }]);
        }
    };
    
    const loadConversation = async () => {
        try {
            const result = await aiAPI.getConversation(projectId);
            if (result.conversation?.length > 0) {
                setMessages(result.conversation);
                return true;
            }
            return false;
        } catch (err) { return false; }
    };
    
    useEffect(() => {
        if (!projectId) { navigate('/dashboard'); return; }
        (async () => {
            const hasHistory = await loadConversation();
            if (!hasHistory) await loadProjectAndBuildWelcome();
        })();
    }, [projectId]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // 上传照片
    const handlePhotoUpload = async (e) => {
        const files = e.target.files;
        if (!files.length) return;
        const formData = new FormData();
        for (let f of files) formData.append('photos', f);
        
        setUploading(true);
        setMessages(prev => [...prev, { role: 'user', content: '📷 上传了 ' + files.length + ' 张照片' }]);
        
        try {
            const token = localStorage.getItem('dear_token');
            const res = await fetch('/api/upload/photos/' + projectId, {
                method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: formData
            });
            const data = await res.json();
            if (data.success) {
                setUploadedPhotos(data.photos);
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ 收到 ' + data.added + ' 张照片！已加入照片墙。' }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ 上传失败，请重试' }]);
        } finally {
            setUploading(false);
            photoInputRef.current.value = '';
        }
    };
    
    // 上传音频
    const handleAudioUpload = async (e) => {
        const files = e.target.files;
        if (!files.length) return;
        const formData = new FormData();
        for (let f of files) formData.append('audio', f);
        
        setUploading(true);
        setMessages(prev => [...prev, { role: 'user', content: '🎵 上传了 ' + files.length + ' 个音频' }]);
        
        try {
            const token = localStorage.getItem('dear_token');
            const res = await fetch('/api/upload/audio/' + projectId, {
                method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: formData
            });
            const data = await res.json();
            if (data.success) {
                setUploadedAudio(data.audio);
                setMessages(prev => [...prev, { role: 'assistant', content: '✅ 收到 ' + data.added + ' 个音频！已嵌入网页。' }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ 上传失败，请重试' }]);
        } finally {
            setUploading(false);
            audioInputRef.current.value = '';
        }
    };
    
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
            setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI服务暂不可用' }]);
        } finally { setLoading(false); }
    };
    
    const handleApplySuggestions = async () => {
        setApplying(true);
        try {
            await aiAPI.applySuggestions(projectId);
            setMessages(prev => [...prev, { role: 'assistant', content: '✅ 已生成最终内容！正在跳转...' }]);
            setTimeout(() => navigate('/preview-confirm/' + projectId), 1500);
        } catch (err) { alert('应用失败：' + err.message); }
        finally { setApplying(false); }
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
                        <div key={i} className={'chat-bubble ' + msg.role}>
                            <div className="chat-avatar">{msg.role === 'assistant' ? '🤖' : '👤'}</div>
                            <div className="chat-content">
                                {msg.content.split('\n').map((line, j) => (
                                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble assistant">
                            <div className="chat-avatar">🤖</div>
                            <div className="chat-content typing"><span className="dot"/><span className="dot"/><span className="dot"/></div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                
                {/* 上传按钮 */}
                <div className="ai-chat-upload-bar">
                    <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} accept="image/*" multiple style={{display:'none'}} />
                    <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" multiple style={{display:'none'}} />
                    <button className="upload-trigger-btn" onClick={() => photoInputRef.current?.click()} disabled={uploading}>📷 上传照片</button>
                    <button className="upload-trigger-btn" onClick={() => audioInputRef.current?.click()} disabled={uploading}>🎵 上传音频</button>
                    {uploadedPhotos.length > 0 && <span className="upload-count">📷 {uploadedPhotos.length}/20</span>}
                    {uploadedAudio.length > 0 && <span className="upload-count">🎵 {uploadedAudio.length}/3</span>}
                </div>
                
                <div className="ai-chat-input-area">
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder="描述你的想法..." rows={2} disabled={loading} />
                    <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>发送</button>
                </div>
                
                {messages.length > 2 && (
                    <div className="ai-chat-actions">
                        <button className="btn btn-primary" onClick={handleApplySuggestions} disabled={applying}>
                            {applying ? '⏳ 正在生成...' : '✨ 应用AI建议，生成网页'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AIChat;