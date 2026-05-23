import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Header.css';

function Header() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        const savedUser = localStorage.getItem('dear_user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);
    
    const logout = () => {
        localStorage.removeItem('dear_token');
        localStorage.removeItem('dear_user');
        setUser(null);
        navigate('/');
    };
    
    return (
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
                        <Link to="/create" className="btn btn-primary btn-small">免费开始</Link>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;