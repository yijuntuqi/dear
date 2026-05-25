import { exportAPI } from '../utils/api';
import './StepDownload.css';

function StepDownload({ project, generatedHtml, onBack }) {
    
    const handleDownloadZip = () => {
        const link = document.createElement('a');
        link.href = exportAPI.downloadSource(project.id);
        link.download = `Dear_${project.owner_name}_源码包.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleDownloadHTML = () => {
        const link = document.createElement('a');
        link.href = exportAPI.downloadHTML(project.id);
        link.download = `Dear_${project.owner_name}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleCopyHTML = () => {
        const htmlToCopy = generatedHtml || '';
        if (!htmlToCopy) {
            alert('没有可复制的内容，请先下载HTML文件');
            return;
        }
        navigator.clipboard.writeText(htmlToCopy).then(() => {
            alert('HTML代码已复制到剪贴板！');
        }).catch(() => {
            alert('复制失败，请尝试下载HTML文件');
        });
    };
    
    return (
        <div className="step-download">
            {/* 顶部已有返回按钮，这里可以去掉 */}
            
            <h2>🎉 恭喜！网页已生成</h2>
            <p className="step-desc">你的专属纪念网页已经准备好了</p>
            
            <div className="download-options">
                <div className="download-card card" onClick={handleDownloadZip}>
                    <span className="download-icon">📦</span>
                    <h3>下载源码包 (ZIP)</h3>
                    <p>包含完整的HTML文件，可以自己托管</p>
                </div>
                
                <div className="download-card card" onClick={handleDownloadHTML}>
                    <span className="download-icon">📄</span>
                    <h3>下载HTML文件</h3>
                    <p>单个HTML文件，可以直接打开</p>
                </div>
                
                <div className="download-card card" onClick={handleCopyHTML}>
                    <span className="download-icon">📋</span>
                    <h3>复制HTML代码</h3>
                    <p>复制完整的网页源代码</p>
                </div>
            </div>
            
            <div className="upgrade-notice card">
                <h3>💎 想获取更多功能？</h3>
                <p>升级到VIP版，享受AI对话定制、照片上传、APP打包等服务</p>
                <button className="btn btn-primary" onClick={() => alert('请通过网站底部的联系方式联系我们')}>
                    了解VIP升级
                </button>
            </div>
        </div>
    );
}

export default StepDownload;