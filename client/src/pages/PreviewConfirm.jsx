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
		// VIP项目且未使用 → 先确认
		if (project.project_type === 'vip' && !project.vip_used) {
			if (!window.confirm('确认创建成功？这将消耗1次VIP权益。')) {
				return;
			}
			// 用户确认后，标记VIP已使用
			try {
				await projectAPI.confirmDownload(project.id);
				setProject(prev => ({ ...prev, vip_used: true, status: 'completed' }));
			} catch (err) {
				alert('确认失败，请重试');
				return;
			}
		}
		
		// 下载
		const link = document.createElement('a');
		link.href = `http://localhost:3001/api/export/source/${projectId}`;
		link.download = `Dear_${project?.owner_name || 'dear'}_源码包.zip`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleDownloadHTML = async () => {
		// 同样逻辑
		if (project.project_type === 'vip' && !project.vip_used) {
			if (!window.confirm('确认创建成功？这将消耗1次VIP权益。')) {
				return;
			}
			try {
				await projectAPI.confirmDownload(project.id);
				setProject(prev => ({ ...prev, vip_used: true, status: 'completed' }));
			} catch (err) {
				alert('确认失败，请重试');
				return;
			}
		}
		
		const link = document.createElement('a');
		link.href = `http://localhost:3001/api/export/html/${projectId}`;
		link.download = `Dear_${project?.owner_name || 'dear'}.html`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
    
    const handleCopyHTML = async () => {
		// VIP项目且未使用 → 先确认
		if (project.project_type !== 'free' && !project.vip_used) {
			if (!window.confirm('确认创建成功？这将消耗1次VIP权益。')) {
				return;
			}
			try {
				await projectAPI.confirmDownload(project.id);
				setProject(prev => ({ ...prev, vip_used: true, status: 'completed' }));
			} catch (err) {
				alert('确认失败，请重试');
				return;
			}
		}
		
		navigator.clipboard.writeText(generatedHtml).then(() => {
			alert('HTML代码已复制！');
		}).catch(() => {
			alert('复制失败，请下载HTML文件');
		});
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