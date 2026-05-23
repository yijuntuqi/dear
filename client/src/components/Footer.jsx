import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-info">
                    <p>📧 202411109014@mail.bnu.edu.cn</p>
                    <p>📱 17796591211</p>
                    <p>🏫 北京师范大学</p>
                    <p>💡 技术支持：PakePlus</p>
                </div>
                <div className="footer-copy">
                    <p>© {currentYear} Dear. Made with ❤️</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;