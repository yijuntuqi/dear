import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepBasicInfo from '../components/StepBasicInfo';
import StepContent from '../components/StepContent';
import StepPreview from '../components/StepPreview';
import StepDownload from '../components/StepDownload';
import { projectAPI } from '../utils/api';
import './Create.css';

function Create() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [project, setProject] = useState(null);
    const [formData, setFormData] = useState({
        ownerName: '',
        relationship: 'parent',
        theme: 'parent',
        basicInfo: { intro: '' },
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
            setStep(3);
        } catch (err) {
            alert('创建失败：' + err.message);
        }
    };
    
    const handleRender = async () => {
        try {
            const result = await projectAPI.render(project.id);
            setGeneratedHtml(result.html);
            setStep(4);
        } catch (err) {
            alert('生成失败：' + err.message);
        }
    };
    
    return (
        <div className="create-page container">
            <div className="step-indicator">
                {['基本信息', '填写内容', '预览确认', '下载网页'].map((label, i) => (
                    <div key={i} className={`step ${step >= i + 1 ? 'active' : ''}`}>
                        <div className="step-circle">{i + 1}</div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
            
            <div className="step-content">
                {step === 1 && (
                    <StepBasicInfo
                        formData={formData}
                        updateForm={updateForm}
                        onNext={() => setStep(2)}
                    />
                )}
                
                {step === 2 && (
                    <StepContent
                        formData={formData}
                        updateForm={updateForm}
                        onBack={() => setStep(1)}
                        onCreate={handleCreate}
                    />
                )}
                
                {step === 3 && project && (
                    <StepPreview
                        project={project}
                        onBack={() => setStep(2)}
                        onRender={handleRender}
                    />
                )}
                
                {step === 4 && (
                    <StepDownload
                        project={project}
                        generatedHtml={generatedHtml}
                    />
                )}
            </div>
        </div>
    );
}

export default Create;