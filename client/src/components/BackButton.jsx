import { useNavigate } from 'react-router-dom';
import './BackButton.css';

function BackButton({ to, label, onCustomClick }) {
    const navigate = useNavigate();
    
    const handleClick = () => {
        if (onCustomClick) {
            onCustomClick();
        } else if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };
    
    return (
        <button className="back-button" onClick={handleClick}>
            <span className="back-arrow">←</span>
            <span className="back-label">{label || '返回'}</span>
        </button>
    );
}

export default BackButton;