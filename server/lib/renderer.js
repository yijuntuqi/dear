const ejs = require('ejs');
const path = require('path');

const THEME_TEMPLATES = {
    parent: 'parent.ejs',
    lover: 'lover.ejs',
    friend: 'friend.ejs',
    teacher: 'teacher.ejs'
};

async function renderPage(projectData) {
    const templateName = THEME_TEMPLATES[projectData.theme] || 'parent.ejs';
    const templatePath = path.join(__dirname, '..', 'templates', templateName);
    
    return new Promise((resolve, reject) => {
        ejs.renderFile(templatePath, { data: projectData }, (err, html) => {
            if (err) reject(err);
            resolve(html);
        });
    });
}

module.exports = { renderPage };