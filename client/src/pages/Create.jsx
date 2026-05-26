import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepBasicInfo from '../components/StepBasicInfo';
import StepContent from '../components/StepContent';
import StepPreview from '../components/StepPreview';
import StepDownload from '../components/StepDownload';
import BackButton from '../components/BackButton';
import { projectAPI } from '../utils/api';
import './Create.css';
import { useNavigate } from 'react-router-dom';

function Create() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
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
    
    const updateForm = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleCreate = async () => {
		try {
			const result = await projectAPI.create(formData);
			setProject(result.project);
			
			// 检查用户是否是VIP
			const user = JSON.parse(localStorage.getItem('dear_user') || '{}');
			if (user.plan_type !== 'free') {
				// VIP用户自动跳转到AI对话页面
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
			alert('创建失败：' + err.message);
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
    
    return (
        <div className="create-page container">
            {/* 全局返回按钮 */}
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
                    <StepContent formData={formData} updateForm={updateForm} onBack={() => setStep(1)} onCreate={handleCreate} />
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