import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import './Header.css';

function Header() {
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    
    // 注册字段
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // 滑块验证
    const [sliderVerified, setSliderVerified] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(0);
    const [sliderDragging, setSliderDragging] = useState(false);
    const [sliderStartX, setSliderStartX] = useState(0);
    
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
    
    // 重置表单
    const resetForm = () => {
        setNickname('');
        setPhone('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setSliderVerified(false);
        setSliderPosition(0);
        setError('');
    };
    
    // 滑块验证处理
    const handleSliderStart = (e) => {
        if (sliderVerified) return;
        setSliderDragging(true);
        setSliderStartX(e.clientX || e.touches[0].clientX);
    };
    
    const handleSliderMove = (e) => {
        if (!sliderDragging || sliderVerified) return;
        const clientX = e.clientX || e.touches[0].clientX;
        const diff = clientX - sliderStartX;
        const maxWidth = 280; // 滑块轨道宽度
        const newPosition = Math.max(0, Math.min(diff, maxWidth));
        setSliderPosition(newPosition);
        
        if (newPosition >= maxWidth - 10) {
            setSliderVerified(true);
            setSliderPosition(maxWidth);
            setSliderDragging(false);
        }
    };
    
    const handleSliderEnd = () => {
        setSliderDragging(false);
        if (!sliderVerified) {
            setSliderPosition(0);
        }
    };
    
    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            let result;
            if (authMode === 'login') {
                // 登录时校验滑块验证
                if (!sliderVerified) {
                    setError('请完成滑块验证');
                    setLoading(false);
                    return;
                }
                result = await authAPI.login(phone, password);
            } else {
                // 注册
                result = await authAPI.register(nickname, phone, email, password);
            }
            
            const userData = result.user;
            localStorage.setItem('dear_token', result.token);
            localStorage.setItem('dear_user', JSON.stringify(userData));
            setUser(userData);
            setShowAuthModal(false);
            resetForm();
        } catch (err) {
            setError(err.message || '操作失败');
            // 登录失败时重置滑块
            if (authMode === 'login') {
                setSliderVerified(false);
                setSliderPosition(0);
            }
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
        resetForm();
    };
    
    return (
        <>
            <header className="header">
                <div className="container header-inner">
                    <Link to="/" className="logo">💝 Dear</Link>
                    <nav className="nav">
                        <Link to="/create">开始创建</Link>
                        {user ? (
                            <>
                                <Link to="/dashboard">我的项目</Link>
                                <span className="user-email">{user.nickname || user.email}</span>
                                <button onClick={logout} className="btn-logout">退出</button>
                            </>
                        ) : (
                            <button 
                                className="btn btn-primary btn-small" 
                                onClick={() => { resetForm(); setShowAuthModal(true); }}
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
                    <div 
                        className="modal-content auth-modal" 
                        onClick={e => e.stopPropagation()}
                        onMouseMove={handleSliderMove}
                        onMouseUp={handleSliderEnd}
                        onTouchMove={handleSliderMove}
                        onTouchEnd={handleSliderEnd}
                    >
                        <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
                        <h2>{authMode === 'login' ? '登录' : '注册'}</h2>
                        
                        <form onSubmit={handleAuth}>
                            {/* 注册模式下的昵称 */}
                            {authMode === 'register' && (
                                <div className="form-group">
                                    <label>昵称 <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        placeholder="给自己起个昵称（唯一）"
                                        maxLength={20}
                                        required
                                    />
                                </div>
                            )}
                            
                            {/* 手机号（注册和登录都必填） */}
                            <div className="form-group">
                                <label>手机号 <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                    placeholder="请输入11位手机号"
                                    maxLength={11}
                                    required
                                />
                            </div>
                            
                            {/* 注册模式下的邮箱（选填） */}
                            {authMode === 'register' && (
                                <div className="form-group">
                                    <label>邮箱 <span className="optional">(选填)</span></label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="选填，方便找回密码"
                                    />
                                </div>
                            )}
                            
                            {/* 密码 */}
                            <div className="form-group">
                                <label>密码 <span className="required">*</span></label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="至少6位密码"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                            
                            {/* 登录时的滑块验证 */}
                            {authMode === 'login' && (
                                <div className="slider-captcha">
                                    <div className="slider-track">
                                        <div 
                                            className="slider-fill" 
                                            style={{ width: `${sliderPosition}px` }}
                                        />
                                        <div 
                                            className={`slider-handle ${sliderVerified ? 'verified' : ''}`}
                                            style={{ left: `${sliderPosition}px` }}
                                            onMouseDown={handleSliderStart}
                                            onTouchStart={handleSliderStart}
                                        >
                                            {sliderVerified ? '✓' : '→'}
                                        </div>
                                        {!sliderVerified && (
                                            <span className="slider-text">请按住滑块拖动到最右边</span>
                                        )}
                                        {sliderVerified && (
                                            <span className="slider-text verified-text">验证通过 ✓</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {error && <p className="auth-error">{error}</p>}
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                style={{ width: '100%' }}
                                disabled={loading || (authMode === 'login' && !sliderVerified)}
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