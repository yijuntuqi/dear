import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import './Header.css';

function Header() {
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
	const [nickname, setNickname] = useState(''); 
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    useEffect(() => {
        const savedUser = localStorage.getItem('dear_user');
        const savedToken = localStorage.getItem('dear_token');
        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
        }
    }, []);
    
    const handleAuth = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		
		try {
			let result;
			if (authMode === 'login') {
				result = await authAPI.login(email, password);
			} else {
				// 注册时传递昵称
				result = await authAPI.register(email, password, nickname);
			}
			
			const userData = result.user;
			localStorage.setItem('dear_token', result.token);
			localStorage.setItem('dear_user', JSON.stringify(userData));
			setUser(userData);
			setShowAuthModal(false);
			setEmail('');
			setPassword('');
			setNickname('');  // 清空昵称
		} catch (err) {
			setError(err.message || '操作失败');
		} finally {
			setLoading(false);
		}
	};
    
    const logout = () => {
        localStorage.removeItem('dear_token');
        localStorage.removeItem('dear_user');
        setUser(null);
        navigate('/');
    };
    
    const switchMode = () => {
		setAuthMode(authMode === 'login' ? 'register' : 'login');
		setError('');
		setNickname('');  // 切换时清空昵称
	};
    
    return (
        <>
            <header className="header">
                <div className="container header-inner">
                    <Link to="/" className="logo">
                        💝 Dear
                    </Link>
                    <nav className="nav">
                        <Link to="/create">开始创建</Link>
                        {user ? (
                            <>
                                <Link to="/dashboard">我的项目</Link>
                                <span className="user-email">{user.email}</span>
                                <button onClick={logout} className="btn-logout">退出</button>
                            </>
                        ) : (
                            <button 
                                className="btn btn-primary btn-small" 
                                onClick={() => setShowAuthModal(true)}
                            >
                                登录 / 注册
                            </button>
                        )}
                    </nav>
                </div>
            </header>
            
            {/* 登录/注册弹窗 */}
            {showAuthModal && (
                <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
                    <div className="modal-content auth-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
                        <h2>{authMode === 'login' ? '登录' : '注册'}</h2>
                        
                                                <form onSubmit={handleAuth}>
                            {/* 注册模式下显示昵称输入框 */}
                            {authMode === 'register' && (
                                <div className="form-group">
                                    <label>昵称</label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        placeholder="给自己起个昵称"
                                        maxLength={20}
                                        required
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>邮箱</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="请输入邮箱"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>密码</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="请输入密码（至少6位）"
                                    minLength={6}
                                    required
                                />
                            </div>
                            
                            {error && <p className="auth-error">{error}</p>}
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? '处理中...' : (authMode === 'login' ? '登录' : '注册')}
                            </button>
                        </form>
                        
                        <p className="auth-switch">
                            {authMode === 'login' ? '还没有账号？' : '已有账号？'}
                            <button onClick={switchMode} className="btn-link">
                                {authMode === 'login' ? '立即注册' : '立即登录'}
                            </button>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

export default Header;