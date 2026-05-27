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
    const [step, setStep] = useState(1);
    const [projectType, setProjectType] = useState('free');
    const [showPlanChoice, setShowPlanChoice] = useState(false);
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
    
    // 首次进入时显示权益选择
    useState(() => {
        if (isVip) {
            setShowPlanChoice(true);
            setStep(0);
        }
    }, []);
    
    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleCreate = async () => {
		try {
			const result = await projectAPI.create(formData, projectType);
			setProject(result.project);
			
			if (projectType === 'vip') {
				navigate('/ai-chat', { 
					state: { 
						projectId: result.project.id, 
						ownerName: result.project.owner_name 
					} 
				});
				return;
			}
			
			setStep(3);
		} catch (err) {
			if (err.message?.includes('VIP权益已使用完毕')) {
				alert('您的VIP权益已使用完毕，请重新购买VIP');
				navigate('/upgrade');
			} else {
				alert('创建失败：' + err.message);
			}
		}
	};
    
    const handleRender = async () => {
        if (!project || !project.id) {
            alert('项目信息异常，请返回重新创建');
            return;
        }
        try {
            const result = await projectAPI.render(project.id);
            setGeneratedHtml(result.html);
            setProject(prev => ({ ...prev, generated_html: result.html, status: 'completed' }));
            setStep(4);
        } catch (err) {
            alert('生成失败：' + err.message);
        }
    };
    
    const goBack = () => {
        if (step > 1) setStep(step - 1);
        else navigate('/');
    };
    
    const stepLabels = ['基本信息', '填写内容', '预览确认', '下载网页'];
    
    // 第0步：VIP权益选择
    if (step === 0) {
        return (
            <div className="create-page container">
                <BackButton to="/" label="返回首页" />
                <div className="plan-choice">
                    <h2>选择创建方式</h2>
                    <p className="plan-choice-desc">你是VIP用户，可以选择不同的创建方式</p>
                    <div className="choice-cards">
                        <div className="choice-card card" onClick={() => { setProjectType('free'); setStep(1); }}>
                            <span className="choice-icon">📝</span>
                            <h3>免费创建</h3>
                            <p>手动填写故事和留言，不消耗VIP权益</p>
                        </div>
                        <div className="choice-card card featured" onClick={() => { setProjectType('vip'); setStep(1); }}>
                            <span className="choice-icon">🤖</span>
                            <h3>使用VIP权益 ✨</h3>
                            <p>AI对话深度定制，智能生成内容，可加进度条等高级功能</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="create-page container">
            <BackButton onCustomClick={goBack} label={step > 1 ? `返回：${stepLabels[step - 2]}` : '返回首页'} />
            
            <div className="step-indicator">
                {stepLabels.map((label, i) => (
                    <div key={i} className={`step ${step >= i + 1 ? 'active' : ''}`}>
                        <div className="step-circle">{i + 1}</div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
            
            <div className="step-content">
                {step === 1 && (
                    <StepBasicInfo formData={formData} updateForm={updateForm} onNext={() => setStep(2)} />
                )}
                {step === 2 && (
                    <StepContent formData={formData} updateForm={updateForm} onBack={() => setStep(1)} onCreate={handleCreate} projectType={projectType}  />
                )}
                {step === 3 && project && (
                    <StepPreview project={project} onBack={() => setStep(2)} onRender={handleRender} />
                )}
                {step === 4 && project && (
                    <StepDownload project={project} generatedHtml={generatedHtml} onBack={() => setStep(3)} />
                )}
            </div>
        </div>
    );
}

export default Create;