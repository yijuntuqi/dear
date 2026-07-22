import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import BackButton from '../components/BackButton';
import './PreviewConfirm.css';

function PreviewConfirm() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [showDownload, setShowDownload] = useState(false);
    
    useEffect(() => {
        loadProject();
    }, [projectId]);
    
    const loadProject = async () => {
        try {
            const result = await projectAPI.get(projectId);
            setProject(result.project);
            if (result.project.generated_html) {
                setGeneratedHtml(result.project.generated_html);
            }
        } catch (err) {
            console.error('加载失败:', err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleRender = async () => {
        try {
            const result = await projectAPI.render(projectId);
            setGeneratedHtml(result.html);
            setProject(prev => ({ ...prev, generated_html: result.html }));
            setShowDownload(true);
        } catch (err) {
            alert('生成失败：' + err.message);
        }
    };
    
    const handleDownloadZip = async () => {
        // 修改：支持 VIP 和 MVP
        if ((project.project_type === 'vip' || project.project_type === 'mvp') && !project.vip_used) {
            if (!window.confirm('确认创建成功？这将消耗1次VIP权益。')) return;
            try {
                await projectAPI.confirmDownload(project.id);
                setProject(prev => ({ ...prev, vip_used: true }));
            } catch (err) { alert('确认失败'); return; }
        }
        
        try {
            const token = localStorage.getItem('dear_token');
            const res = await fetch(`/api/export/source/${projectId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('下载失败');
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Dear_${project?.owner_name || 'dear'}_源码包.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            await projectAPI.updateStatus(projectId, 'completed');
            setProject(prev => ({ ...prev, status: 'completed' }));
        } catch (err) {
            console.error('下载失败:', err);
        }
    };

    const handleDownloadHTML = async () => {
        // 修改：支持 VIP 和 MVP
        if ((project.project_type === 'vip' || project.project_type === 'mvp') && !project.vip_used) {
            if (!window.confirm('确认创建成功？这将消耗1次VIP权益。')) return;
            try {
                await projectAPI.confirmDownload(project.id);
                setProject(prev => ({ ...prev, vip_used: true }));
            } catch (err) { alert('确认失败'); return; }
        }
        
        try {
            const token = localStorage.getItem('dear_token');
            const res = await fetch(`/api/export/html/${projectId}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('下载失败');
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Dear_${project?.owner_name || 'dear'}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            await projectAPI.updateStatus(projectId, 'completed');
            setProject(prev => ({ ...prev, status: 'completed' }));
        } catch (err) {
            console.error('下载失败:', err);
        }
    };
    
    const handleCopyHTML = async () => {
        // 修改：支持 VIP 和 MVP
        if ((project.project_type === 'vip' || project.project_type === 'mvp') && !project.vip_used) {
            if (!window.confirm('确认创建成功？这将消耗1次VIP权益。')) return;
            try {
                await projectAPI.confirmDownload(project.id);
                setProject(prev => ({ ...prev, vip_used: true }));
            } catch (err) { alert('确认失败'); return; }
        }
        
        try {
            await navigator.clipboard.writeText(generatedHtml);
            alert('HTML代码已复制！');
            console.log('🔍 准备标记完成, projectId:', projectId);
            try {
                const result = await projectAPI.updateStatus(projectId, 'completed');
                console.log('✅ 标记完成成功:', result);
                setProject(prev => ({ ...prev, status: 'completed' }));
            } catch (err) {
                console.error('❌ 标记完成失败:', err.message, err);
            }
        } catch (err) {
            alert('复制失败，请下载HTML文件');
        }
    };
    
    if (loading) return <div className="container">加载中...</div>;
    if (!project) return <div className="container">项目不存在</div>;
    
    return (
        <div className="preview-confirm-page container">
            <BackButton to="/dashboard" label="返回项目列表" />
            
            <h2>👁️ 预览确认</h2>
            
            {/* 预览iframe */}
            {generatedHtml && (
                <div className="preview-frame">
                    <iframe srcDoc={generatedHtml} title="预览" sandbox="allow-same-origin" />
                </div>
            )}
            
            {/* 生成/重新生成按钮 */}
            <div className="preview-actions">
                <button className="btn btn-secondary" onClick={handleRender}>
                    {generatedHtml ? '🔄 重新生成网页' : '🎨 生成网页'}
                </button>
            </div>
            
            {/* 下载区域 */}
            {generatedHtml && (
                <div className="download-section">
                    <h3>📥 下载网页</h3>
                    <div className="download-options">
                        <div className="download-card card" onClick={handleDownloadZip}>
                            <span className="download-icon">📦</span>
                            <h4>下载源码包 (ZIP)</h4>
                            <p>包含完整HTML文件</p>
                        </div>
                        <div className="download-card card" onClick={handleDownloadHTML}>
                            <span className="download-icon">📄</span>
                            <h4>下载HTML文件</h4>
                            <p>单个HTML文件</p>
                        </div>
                        <div className="download-card card" onClick={handleCopyHTML}>
                            <span className="download-icon">📋</span>
                            <h4>复制HTML代码</h4>
                            <p>复制网页源代码</p>
                        </div>
                        
                        {/* 新增：MVP 专属打包 APP 卡片 */}
                        {project.project_type === 'mvp' && (
                            <div className="download-card card" onClick={() => navigate(`/pack/${project.id}`)}>
                                <span className="download-icon">🚀</span>
                                <h4>打包 APP</h4>
                                <p>生成 Windows EXE / Android APK</p>
                                <span className="badge">MVP专属</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* 项目信息 */}
            <div className="project-info card">
                <h3>📋 页面信息</h3>
                <p><strong>送给：</strong>{project.owner_name}</p>
                <p><strong>关系：</strong>{project.relationship}</p>
                <p><strong>主题：</strong>{project.theme}</p>
                <p><strong>故事数量：</strong>{project.stories?.length || 0} 个</p>
            </div>
        </div>
    );
}

export default PreviewConfirm;