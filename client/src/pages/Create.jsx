import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepBasicInfo from '../components/StepBasicInfo';
import StepContent from '../components/StepContent';
import StepPreview from '../components/StepPreview';
import StepDownload from '../components/StepDownload';
import BackButton from '../components/BackButton';
import { projectAPI } from '../utils/api';
import './Create.css';

function Create() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);  // 新增第0步：选择权益
    const [projectType, setProjectType] = useState('free');  // 项目类型
    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({
        ownerName: '',
        relationship: 'parent',
        theme: 'parent',
        basicInfo: { intro: '', authorName: '' },
        stories: [{ title: '', content: '' }],
        message: ''
    });
    const [generatedHtml, setGeneratedHtml] = useState('');
    
    const user = JSON.parse(localStorage.getItem('dear_user') || '{}');
    const isVip = user.plan_type !== 'free';
    
    const handleCreate = async () => {
        try {
            const result = await projectAPI.create(formData, projectType);
            setProject(result.project);
            
            // VIP且选择使用AI → 跳转AI对话
            if (projectType === 'vip') {
                navigate('/ai-chat', { 
                    state: { 
                        projectId: result.project.id, 
                        ownerName: result.project.owner_name 
                    } 
                });
                return;
            }
            
            setStep(3);  // 免费用户直接预览
        } catch (err) {
            alert('创建失败：' + err.message);
        }
    };
    
    // 第0步：选择权益
    if (step === 0 && isVip) {
        return (
            <div className="create-page container">
                <BackButton to="/" label="返回首页" />
                <div className="plan-choice">
                    <h2>选择创建方式</h2>
                    <div className="choice-cards">
                        <div className="choice-card card" onClick={() => { setProjectType('free'); setStep(1); }}>
                            <span className="choice-icon">📝</span>
                            <h3>免费创建</h3>
                            <p>手动填写内容，不消耗VIP权益</p>
                        </div>
                        <div className="choice-card card featured" onClick={() => { setProjectType('vip'); setStep(1); }}>
                            <span className="choice-icon">🤖</span>
                            <h3>使用VIP权益</h3>
                            <p>AI对话深度定制，消耗1次VIP权益</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // 免费用户直接从第1步开始
    // ... 其余步骤保持不变
}