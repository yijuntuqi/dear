import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectAPI } from '../utils/api';
import './Preview.css';

function Preview() {
    const { id } = useParams();
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const loadProject = async () => {
            try {
                const result = await projectAPI.get(id);
                if (result.project?.generated_html) {
                    setHtml(result.project.generated_html);
                } else {
                    const renderResult = await projectAPI.render(id);
                    setHtml(renderResult.html);
                }
            } catch (err) {
                console.error('加载失败:', err);
            } finally {
                setLoading(false);
            }
        };
        loadProject();
    }, [id]);
    
    if (loading) return <div className="container loading">加载中...</div>;
    
    return (
        <div className="preview-page">
            <iframe
                srcDoc={html}
                title="预览"
                className="preview-iframe"
                sandbox="allow-same-origin"
            />
        </div>
    );
}

export default Preview;