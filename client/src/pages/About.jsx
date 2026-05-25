import './About.css';
import BackButton from '../components/BackButton';

function About() {
    return (
        <div className="about-page container">
			<BackButton to="/" label="返回首页" />
            <section className="about-hero">
                <h1>关于 Dear</h1>
                <p className="about-subtitle">为你所爱的人，写一页 Dear</p>
            </section>

            <section className="about-story card">
                <h2>💡 为什么做 Dear？</h2>
                <p>
                    在这个数字时代，我们每天都在发消息、刷朋友圈，但很少有人会专门为心中重要的人，
                    做一个专属的网页。Dear 的初衷很简单——让每个人都有能力，用最温暖的方式，
                    向所爱之人表达心意。
                </p>
                <p>
                    不需要懂编程，不需要学设计，只需告诉 Dear 你想对谁说什么，
                    我们就能帮你生成一个独一无二的纪念网页。
                </p>
            </section>

            <section className="about-features">
                <h2>✨ Dear 能做什么</h2>
                <div className="features-grid">
                    <div className="feature-card card">
                        <span className="feature-icon">📝</span>
                        <h3>简单填写</h3>
                        <p>输入TA的名字和你们的关系，选择喜欢的主题风格</p>
                    </div>
                    <div className="feature-card card">
                        <span className="feature-icon">🤖</span>
                        <h3>AI 辅助</h3>
                        <p>不知道写什么？让AI帮你生成温暖的故事和留言</p>
                    </div>
                    <div className="feature-card card">
                        <span className="feature-icon">🎨</span>
                        <h3>精美模板</h3>
                        <p>多种主题模板，适配不同关系和情感氛围</p>
                    </div>
                    <div className="feature-card card">
                        <span className="feature-icon">📥</span>
                        <h3>源码下载</h3>
                        <p>生成的网页源码完全归你所有，可永久保存</p>
                    </div>
                </div>
            </section>

            <section className="about-contact card">
                <h2>📬 联系我们</h2>
                <div className="contact-info">
                    <p>📧 邮箱：202411109014@mail.bnu.edu.cn</p>
                    <p>📱 电话：17796591211</p>
                    <p>🏫 北京师范大学</p>
                    <p>💡 技术支持：PakePlus</p>
                </div>
            </section>
        </div>
    );
}

export default About;