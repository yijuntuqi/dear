import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, exportAPI } from '../utils/api';
import './Dashboard.css';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('dear_user');
        if (!savedUser) {
            navigate('/create');
            return;
        }
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const result = await projectAPI.list();
            setProjects(result.projects || []);
        } catch (err) {
            console.error('加载项目失败:', err);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这个项目吗？')) return;
        try {
            await projectAPI.delete(id);
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            alert('删除失败：' + err.message);
        }
    };

    // 跳转到下载页面
    const handleGoDownload = (project) => {
        navigate(`/preview-confirm/${project.id}`);
    };

    // 继续编辑草稿
    const handleContinueEdit = (project) => {
        if (project.project_type === 'vip' && !project.vip_used) {
            // VIP草稿 → 跳转到AI对话页面继续
            navigate('/ai-chat', {
                state: {
                    projectId: project.id,
                    ownerName: project.owner_name
                }
            });
        } else {
            // 免费项目 → 跳转到预览页面
            navigate(`/preview-confirm/${project.id}`);
        }
    };

    const relationshipMap = {
        parent: '👨‍👩‍👧 父母',
        grandparent: '👴 爷爷奶奶',
        sibling: '👫 兄弟姐妹',
        lover: '💕 伴侣',
        friend: '🌟 朋友',
        teacher: '📚 老师',
        family: '🧡 亲人',
        uncle: '🧡 叔叔/舅舅',
        aunt: '🧡 阿姨/姑姑',
        cousin: '🧡 堂/表亲'
    };

    const themeMap = {
        parent: '🏠 温馨亲情',
        lover: '💕 浪漫爱情',
        friend: '🌟 真挚友情',
        teacher: '📚 庄重师恩',
        family: '🧡 温暖亲人'
    };

    const typeLabels = {
        free: { label: '免费', className: 'type-free' },
        vip: { label: 'VIP', className: 'type-vip' },
        mvp: { label: 'MVP', className: 'type-mvp' }
    };

    const statusLabels = {
        draft: { label: '草稿', className: 'status-draft' },
        completed: { label: '已完成', className: 'status-completed' },
        delivered: { label: '已交付', className: 'status-delivered' }
    };

    if (loading) {
        return <div className="dashboard-loading">加载中...</div>;
    }

    return (
        <div className="dashboard-page container">
            <div className="dashboard-header">
                <h1>📋 我的项目</h1>
                <button className="btn btn-primary" onClick={() => navigate('/create')}>
                    + 创建新项目
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="empty-state card">
                    <span className="empty-icon">📝</span>
                    <h2>还没有项目</h2>
                    <p>为你所爱的人创建一个专属纪念网页吧</p>
                    <button className="btn btn-primary" onClick={() => navigate('/create')}>
                        开始创建
                    </button>
                </div>
            ) : (
                <div className="project-grid">
                    {projects.map(project => (
                        <div key={project.id} className="project-card card">
                            <div className="project-header">
                                <h3>💝 {project.owner_name}</h3>
                                <div className="project-badges">
                                    <span className={`type-badge ${typeLabels[project.project_type]?.className}`}>
                                        {typeLabels[project.project_type]?.label}
                                    </span>
                                    <span className={`status-badge ${statusLabels[project.status]?.className}`}>
                                        {statusLabels[project.status]?.label}
                                    </span>
                                </div>
                            </div>
                            <div className="project-meta">
                                <p>{relationshipMap[project.relationship] || '重要的人'}</p>
                                <p>{themeMap[project.theme] || project.theme}</p>
                                <p className="project-date">
                                    {new Date(project.created_at).toLocaleDateString('zh-CN')}
                                </p>
                            </div>
                            <div className="project-actions">
                                {/* 草稿 → 继续编辑 */}
                                {project.status === 'draft' && (
                                    <button
                                        className="btn btn-primary btn-small"
                                        onClick={() => handleContinueEdit(project)}
                                    >
                                        ✏️ 继续编辑
                                    </button>
                                )}
                                
                                {/* 已完成 → 预览 + 下载 + 删除 */}
                                {project.status === 'completed' && (
                                    <>
                                        <button
                                            className="btn btn-secondary btn-small"
                                            onClick={() => navigate(`/preview/${project.id}`)}
                                        >
                                            👁️ 预览
                                        </button>
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={() => handleGoDownload(project)}
                                        >
                                            📥 下载
                                        </button>
                                    </>
                                )}
                                
                                {/* 所有项目都可以删除 */}
                                <button
                                    className="btn btn-danger btn-small"
                                    onClick={() => handleDelete(project.id)}
                                >
                                    🗑️ 删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;