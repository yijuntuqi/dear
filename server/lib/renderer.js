const ejs = require('ejs');
const path = require('path');

// 主题模板映射
const THEME_TEMPLATES = {
    parent: 'parent.ejs',
    lover: 'lover.ejs',
    friend: 'friend.ejs',
    teacher: 'teacher.ejs',
    family: 'family.ejs'      // 新增亲人模板
};

// 关系代码 → 献词 的映射表
const DEDICATION_MAP = {
    // 原有关系
    parent: '亲爱的爸爸/妈妈',
    lover: '我最爱的人',
    friend: '我最好的朋友',
    teacher: '敬爱的老师',
    
    // 新增亲人细分
    family: '致最亲的人',
    grandparent: '致最敬爱的爷爷奶奶',
    sibling: '致最亲爱的兄弟姐妹',
    uncle: '致亲爱的叔叔/舅舅',
    aunt: '致亲爱的阿姨/姑姑',
    cousin: '致亲爱的兄弟姐妹'
};

/**
 * 根据关系代码获取献词
 * @param {string} relationship - 关系代码
 * @returns {string} 献词文本
 */
function getDedication(relationship) {
    return DEDICATION_MAP[relationship] || '重要的人';
}

/**
 * 渲染纪念页面
 * @param {object} projectData - 项目数据
 * @returns {Promise<string>} 渲染后的 HTML
 */
async function renderPage(projectData) {
    const templateName = THEME_TEMPLATES[projectData.theme] || 'parent.ejs';
    const templatePath = path.join(__dirname, '..', 'templates', templateName);
    
    const dedication = projectData.dedication || getDedication(projectData.relationship);
    
    // 合并AI生成的内容（如果有的话）
    const stories = projectData.stories || [];
    const message = projectData.message || '';
    
    // 准备渲染数据
    const renderData = {
        data: {
            ...projectData,
            dedication,
            stories: stories,
            message: message,
            basic_info: {
                ...projectData.basic_info,
                meetDate: projectData.basic_info?.meetDate || null,
                timelineLabel: projectData.basic_info?.timelineLabel || '和你相识后的每一秒我都感到幸福'
            }
        }
    };
    
    return new Promise((resolve, reject) => {
        ejs.renderFile(templatePath, renderData, (err, html) => {
            if (err) reject(err);
            resolve(html);
        });
    });
}

module.exports = { renderPage, getDedication, DEDICATION_MAP };