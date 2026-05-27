import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import './Dashboard.css';
import BackButton from '../components/BackButton';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('dear_user');
        if (!savedUser) {
            navigate('/create');
            return;
        }
        setUser(JSON.parse(savedUser));
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const result = await projectAPI.list();
            setProjects(result.projects || []);
        } catch (err) {
            console.error('加载项目失败:', err);
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
	
	const handleDownload = (project) => {
		const link = document.createElement('a');
		link.href = `http://localhost:3001/api/export/source/${project.id}`;
		link.download = `Dear_${project.owner_name}_源码包.zip`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
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
		free: { label: '免费', color: '#999' },
		vip: { label: 'VIP', color: '#ff6b8a' },
		mvp: { label: 'MVP', color: '#f57c00' }
	};

    if (loading) {
        return <div className="dashboard-loading">加载中...</div>;
    }

    return (
        <div className="dashboard-page container">
			<BackButton to="/" label="返回首页" />
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
								<span className="type-badge" style={{ background: typeLabels[project.project_type]?.color }}>
									{typeLabels[project.project_type]?.label}
								</span>
                                <span className={`status-badge ${project.status}`}>
                                    {project.status === 'draft' ? '草稿' : 
                                     project.status === 'completed' ? '已完成' : '已交付'}
                                </span>
                            </div>
                            <div className="project-meta">
                                <p>{relationshipMap[project.relationship] || '重要的人'}</p>
                                <p>{themeMap[project.theme] || project.theme}</p>
                                <p className="project-date">
                                    {new Date(project.created_at).toLocaleDateString('zh-CN')}
                                </p>
                            </div>
                            <div className="project-actions">
                                <button
                                    className="btn btn-secondary btn-small"
                                    onClick={() => navigate(`/preview/${project.id}`)}
                                >
                                    预览
                                </button>
								{project.status === 'completed' && project.generated_html && (
									<button className="btn btn-primary btn-small" onClick={() => handleDownload(project)}>
										📥 下载
									</button>
								)}
                                <button
                                    className="btn btn-danger btn-small"
                                    onClick={() => handleDelete(project.id)}
                                >
                                    删除
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