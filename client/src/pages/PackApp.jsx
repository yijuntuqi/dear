import { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import BackButton from '../components/BackButton';
import './PackApp.css';

function PackApp() {
    const { projectId } = useParams();
    const [appName, setAppName] = useState('');
    const [iconFile, setIconFile] = useState(null);       // 原始文件
    const [iconSrc, setIconSrc] = useState(null);          // 预览用的 data URL
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false); // 是否显示裁剪界面
    const [finalIcon, setFinalIcon] = useState(null);      // 裁剪后的 Base64
    const [platform, setPlatform] = useState('windows');
    const [building, setBuilding] = useState(false);
    const fileInputRef = useRef(null);
    
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);
    
    // 选择文件后打开裁剪界面
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIconFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setIconSrc(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };
    
    // 确认裁剪
    const handleCropConfirm = async () => {
        if (!iconSrc || !croppedAreaPixels) return;
        const croppedImage = await getCroppedImg(iconSrc, croppedAreaPixels);
        setFinalIcon(croppedImage);
        setShowCropper(false);
    };
    
    // 取消裁剪
    const handleCropCancel = () => {
        setShowCropper(false);
        setIconSrc(null);
        setIconFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    // 用 Canvas 裁剪图片
    const getCroppedImg = (imageSrc, pixelCrop) => {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = imageSrc;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = pixelCrop.width;
                canvas.height = pixelCrop.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(
                    image,
                    pixelCrop.x,
                    pixelCrop.y,
                    pixelCrop.width,
                    pixelCrop.height,
                    0,
                    0,
                    pixelCrop.width,
                    pixelCrop.height
                );
                resolve(canvas.toDataURL('image/png'));
            };
        });
    };
    
    const handleBuild = async () => {
        if (!appName.trim()) {
            alert('请输入应用名称');
            return;
        }
        setBuilding(true);
        try {
            const token = localStorage.getItem('dear_token');
            const res = await fetch(`/api/pack/build/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    platform: platform,
                    appName: appName,
                    icon: finalIcon
                })
            });
            const data = await res.json();
            if (data.success) {
				if (window.confirm('打包成功,点击"确定"开始下载！\n\n⚠️ s请信任此安装包，在浏览器中选择保留下载即可。')) {
					window.open(data.downloadUrl, '_blank');
				}
			} else {
                alert('打包失败：' + (data.error || '未知错误'));
            }
        } catch (err) {
            alert('打包失败，请稍后重试');
        } finally {
            setBuilding(false);
        }
    };
    
    return (
        <div className="pack-app-page container">
            <BackButton to="/dashboard" label="返回" />
            <h2>📦 打包专属 APP</h2>
            
            <div className="form-group">
                <label>应用名称</label>
                <input 
                    type="text" 
                    value={appName} 
                    onChange={e => setAppName(e.target.value)} 
                    placeholder="输入应用名称" 
                    className="pack-input"
                />
            </div>
            
            <div className="form-group">
                <label>应用图标（正方形，建议 512x512）</label>
                <div className="icon-upload-area" onClick={() => !showCropper && fileInputRef.current?.click()}>
                    {finalIcon ? (
                        <img src={finalIcon} alt="图标预览" className="icon-preview" />
                    ) : (
                        <p>点击上传图标（PNG/JPG）</p>
                    )}
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/png,image/jpeg" 
                    style={{ display: 'none' }} 
                />
            </div>
            
            {/* 裁剪弹窗 */}
            {showCropper && (
                <div className="cropper-overlay">
                    <div className="cropper-modal">
                        <h3>裁剪图标（正方形）</h3>
                        <div className="cropper-container">
                            <Cropper
                                image={iconSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}           // 强制正方形
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                        <div className="cropper-actions">
                            <button className="btn btn-secondary" onClick={handleCropCancel}>取消</button>
                            <button className="btn btn-primary" onClick={handleCropConfirm}>确认裁剪</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="form-group">
                <label>选择平台</label>
                <div className="platform-options">
                    <div 
                        className={`platform-card ${platform === 'windows' ? 'selected' : ''}`}
                        onClick={() => setPlatform('windows')}
                    >
                        <span className="platform-icon">💻</span>
                        <span>Windows EXE</span>
                    </div>
                    <div 
                        className={`platform-card ${platform === 'android' ? 'selected' : ''}`}
                        onClick={() => setPlatform('android')}
                    >
                        <span className="platform-icon">📱</span>
                        <span>Android APK</span>
                    </div>
                </div>
            </div>
            
            <button 
                className="btn btn-primary btn-block" 
                onClick={handleBuild}
                disabled={building}
            >
                {building ? '⏳ 打包中，请稍候...' : '🚀 开始打包'}
            </button>
        </div>
    );
}

export default PackApp;