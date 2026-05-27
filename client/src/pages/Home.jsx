import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    
    return (
        <div className="home">
            <section className="hero">
                <div className="container">
                    <h1>为你所爱的人，写一页 <span className="highlight">Dear</span></h1>
                    <p className="hero-subtitle">
                        三分钟创建一个专属纪念网页，送给最重要的人
                    </p>
                    <button className="btn btn-primary btn-large" onClick={() => navigate('/create')}>
                        💝 免费开始创建
                    </button>
                </div>
            </section>
            
            <section className="how-it-works container">
                <h2>📝 三步完成</h2>
                <div className="steps">
                    <div className="step-card card">
                        <div className="step-number">1</div>
                        <h3>填写信息</h3>
                        <p>输入TA的名字、你们的关系，选择一个主题风格</p>
                    </div>
                    <div className="step-card card">
                        <div className="step-number">2</div>
                        <h3>生成内容</h3>
                        <p>写下你们的故事，或让AI帮你生成温暖的内容</p>
                    </div>
                    <div className="step-card card">
                        <div className="step-number">3</div>
                        <h3>下载网页</h3>
                        <p>一键生成完整网页，下载源码永久保存</p>
                    </div>
                </div>
            </section>
            
            <section className="pricing container">
                <h2>💎 选择方案</h2>
                <div className="pricing-cards">
                    <div className="pricing-card card">
                        <h3>免费版</h3>
                        <p className="price">¥0</p>
                        <ul>
                            <li>✅ 基本信息填写</li>
                            <li>✅ 4套精美模板</li>
                            <li>✅ 故事内容编辑</li>
                            <li>✅ 网页源码下载</li>
                        </ul>
                        <button className="btn btn-secondary" onClick={() => navigate('/create')}>
                            开始使用
                        </button>
                    </div>
                    <div className="pricing-card card featured">
                        <div className="popular-badge">🔥 热门</div>
                        <h3>VIP版</h3>
                        <p className="price">¥29.9<span>/次</span></p>
                        <ul>
                            <li>✅ 免费版全部功能</li>
                            <li>✅ AI智能生成内容</li>
                            <li>✅ AI对话深度定制</li>
                            <li>✅ 照片/音频上传</li>
                            <li>✅ 无限次修改</li>
                        </ul>
                        <button className="btn btn-primary" onClick={() => navigate('/upgrade')}>
							升级VIP
						</button>
                    </div>
                    <div className="pricing-card card">
                        <h3>MVP版</h3>
                        <p className="price">¥199<span>/次</span></p>
                        <ul>
                            <li>✅ VIP版全部功能</li>
                            <li>✅ APP打包(手机+电脑)</li>
                            <li>✅ 自定义应用图标</li>
                            <li>✅ 1对1专属服务</li>
                        </ul>
                        <button className="btn btn-secondary" onClick={() => navigate('/upgrade')}>
							升级MVP
						</button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;