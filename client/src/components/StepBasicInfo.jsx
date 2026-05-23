import './StepBasicInfo.css';

const RELATIONSHIPS = [
    { value: 'parent', label: '👨‍👩‍👧 父母', desc: '给爸爸/妈妈的专属页面' },
    { value: 'grandparent', label: '👴 爷爷奶奶', desc: '给最敬爱的长辈' },
    { value: 'sibling', label: '👫 兄弟姐妹', desc: '给一起长大的TA' },
    { value: 'lover', label: '💕 伴侣', desc: '给最爱的人' },
    { value: 'friend', label: '🌟 朋友', desc: '给最好的朋友' },
    { value: 'teacher', label: '📚 老师', desc: '给敬爱的恩师' },
    { value: 'family', label: '🧡 其他亲人', desc: '给叔叔阿姨等亲人' },
    { value: 'uncle', label: '🧡 叔叔/舅舅', desc: '给亲爱的叔叔/舅舅' },
    { value: 'aunt', label: '🧡 阿姨/姑姑', desc: '给亲爱的阿姨/姑姑' },
    { value: 'cousin', label: '🧡 堂/表亲', desc: '给亲爱的兄弟姐妹' },
];

const THEMES = [
    { value: 'parent', label: '🏠 温馨亲情', desc: '温暖橙粉色调' },
    { value: 'lover', label: '💕 浪漫爱情', desc: '柔和玫瑰金色调' },
    { value: 'friend', label: '🌟 真挚友情', desc: '清新蓝绿色调' },
    { value: 'teacher', label: '📚 庄重师恩', desc: '典雅金棕色调' },
    { value: 'family', label: '🧡 温暖亲人', desc: '暖阳橙色调' },
];

function StepBasicInfo({ formData, updateForm, onNext }) {
    const canNext = formData.ownerName.trim() && formData.relationship;
    
    return (
        <div className="step-basic-info">
            <h2>📝 第一步：基本信息</h2>
            <p className="step-desc">告诉我们，这个页面是送给谁的？</p>
            
            <div className="form-group">
                <label>TA的名字 *</label>
                <input
                    type="text"
                    value={formData.ownerName}
                    onChange={e => updateForm('ownerName', e.target.value)}
                    placeholder="输入TA的名字或称呼"
                    maxLength={30}
                />
            </div>
            
            <div className="form-group">
                <label>你们的关系 *</label>
                <div className="relationship-grid">
                    {RELATIONSHIPS.map(rel => (
                        <div
                            key={rel.value}
                            className={`rel-card ${formData.relationship === rel.value ? 'selected' : ''}`}
                            onClick={() => updateForm('relationship', rel.value)}
                        >
                            <span className="rel-label">{rel.label}</span>
                            <span className="rel-desc">{rel.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="form-group">
                <label>选择主题风格</label>
                <div className="theme-grid">
                    {THEMES.map(theme => (
                        <div
                            key={theme.value}
                            className={`theme-card ${formData.theme === theme.value ? 'selected' : ''}`}
                            onClick={() => updateForm('theme', theme.value)}
                        >
                            <span className="theme-label">{theme.label}</span>
                            <span className="theme-desc">{theme.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="form-group">
                <label>一句话简介（选填）</label>
                <input
                    type="text"
                    value={formData.basicInfo?.intro || ''}
                    onChange={e => updateForm('basicInfo', { ...formData.basicInfo, intro: e.target.value })}
                    placeholder="例如：世界上最温柔的人"
                    maxLength={50}
                />
            </div>
            
			<div className="form-group">
				<label>你的署名（选填）</label>
				<input
					type="text"
					value={formData.basicInfo?.authorName || ''}
					onChange={e => updateForm('basicInfo', { ...formData.basicInfo, authorName: e.target.value })}
					placeholder="网页右下角会显示你的署名，如：永远爱你的女儿"
					maxLength={30}
				/>
				<small style={{ color: '#999', display: 'block', marginTop: 5 }}>
					这将在网页右下角签名区展示
				</small>
			</div>

            <div className="step-actions">
                <button className="btn btn-primary" onClick={onNext} disabled={!canNext}>
                    下一步 → 填写内容
                </button>
            </div>
        </div>
    );
}

export default StepBasicInfo;