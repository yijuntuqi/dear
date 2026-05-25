import { useState } from 'react';
import BackButton from '../components/BackButton';
import './Upgrade.css';

function Upgrade() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showPayment, setShowPayment] = useState(false);
    const [orderId, setOrderId] = useState('');
    
    const plans = [
        {
            id: 'vip',
            name: 'VIP版',
            price: 29.9,
            features: [
                'AI智能生成内容',
                'AI对话深度定制',
                '照片上传（最多20张）',
                '音频上传',
                'AI智能配色',
                '时间轴故事',
                '无限次修改'
            ]
        },
        {
            id: 'mvp',
            name: 'MVP版',
            price: 199,
            features: [
                'VIP版全部功能',
                'Windows EXE安装包',
                'Android APK安装包',
                '自定义应用图标',
                '自定义启动画面',
                '1对1专属服务'
            ]
        }
    ];
    
    const generateOrderId = () => {
        const now = new Date();
        const date = now.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 900) + 100;
        return `DEAR-${date}-${random}`;
    };
    
    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        const newOrderId = generateOrderId();
        setOrderId(newOrderId);
        setShowPayment(true);
    };
    
    const copyOrderId = () => {
        navigator.clipboard.writeText(orderId).then(() => {
            alert('订单号已复制！');
        });
    };
    
    return (
        <div className="upgrade-page container">
            <BackButton to="/" label="返回首页" />
            
            <div className="upgrade-header">
                <h1>💎 升级会员</h1>
                <p>解锁更多功能，为你所爱的人定制更精美的专属网页</p>
            </div>
            
            {!showPayment ? (
                <div className="plans-grid">
                    {plans.map(plan => (
                        <div key={plan.id} className={`plan-card card ${plan.id === 'mvp' ? 'featured' : ''}`}>
                            {plan.id === 'mvp' && <div className="plan-badge">🔥 推荐</div>}
                            <h2>{plan.name}</h2>
                            <p className="plan-price">¥{plan.price}<span>/次</span></p>
                            <ul className="plan-features">
                                {plan.features.map((f, i) => (
                                    <li key={i}>✅ {f}</li>
                                ))}
                            </ul>
                            <button className="btn btn-primary btn-block" onClick={() => handleSelectPlan(plan)}>
                                立即升级 {plan.name}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="payment-section card">
                    <h2>📱 扫码支付</h2>
                    <p className="order-info">
                        订单号：<strong className="order-id">{orderId}</strong>
                        <button className="btn-copy" onClick={copyOrderId}>复制</button>
                    </p>
                    <p className="order-amount">支付金额：<strong>¥{selectedPlan.price}</strong></p>
                    
                    <div className="payment-steps">
                        <div className="step-item">
                            <span className="step-num">1</span>
                            <p>请截图保存下方收款码</p>
                        </div>
                        <div className="step-item">
                            <span className="step-num">2</span>
                            <p>打开支付宝/微信App，扫描收款码</p>
                        </div>
                        <div className="step-item">
                            <span className="step-num">3</span>
                            <p>输入金额 <strong>¥{selectedPlan.price}</strong></p>
                        </div>
                        <div className="step-item highlight-step">
                            <span className="step-num">⚠️</span>
                            <p><strong>务必在"添加备注"中填写订单号：<br/>{orderId}</strong></p>
                        </div>
                        <div className="step-item">
                            <span className="step-num">4</span>
                            <p>完成支付后，我们将在24小时内确认并开通</p>
                        </div>
                    </div>
                    
                    <div className="qrcode-container">
                        <div className="qrcode-item">
                            <img src="/images/微信收款码.jpg" alt="微信收款码" />
                            <p>微信扫码支付</p>
                        </div>
                        <div className="qrcode-item">
                            <img src="/images/支付宝收款码.jpg" alt="支付宝收款码" />
                            <p>支付宝扫码支付</p>
                        </div>
                    </div>
                    
                    <div className="payment-notice">
                        <p>💡 支付完成后请耐心等待，我们会在确认到账后24小时内自动为您开通权限</p>
                        <p>📧 如有问题，请联系：17796591211(电话)或202411109014@mail.bnu.edu.cn(邮箱)</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Upgrade;