const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { projectDB, exportDB } = require('../lib/db');
const { exec, execSync } = require('child_process');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dear-secret';

// Tauri 项目路径
const TAURI_DIR = path.join(__dirname, '..', '..', 'tauri');

// 认证中间件
function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '请先登录' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({ error: 'token无效' });
    }
}

// MVP打包接口
router.post('/build/:projectId', authMiddleware, async (req, res) => {
    try {
        const { appName, platform } = req.body;

        // 1. 获取项目数据
        const project = await projectDB.getById(req.params.projectId);
        if (!project) return res.status(404).json({ error: '项目不存在' });
        if (!project.generated_html) return res.status(400).json({ error: '请先生成网页' });

        const name = appName || ('Dear_' + (project.owner_name || 'TA'));

        // 2. 把用户生成的 HTML 写入 Tauri 的 src/index.html
        const htmlPath = path.join(TAURI_DIR, 'src', 'index.html');
        fs.writeFileSync(htmlPath, project.generated_html, 'utf-8');
        console.log('[打包] HTML 已写入:', htmlPath);

        // 3. 处理自定义图标（如果有）
        if (req.body.icon) {
            const base64Data = req.body.icon.replace(/^data:image\/\w+;base64,/, '');
            const iconBuffer = Buffer.from(base64Data, 'base64');
            const iconPngPath = path.join(TAURI_DIR, 'src-tauri', 'icons', 'icon.png');
            fs.writeFileSync(iconPngPath, iconBuffer);
            
            console.log('[打包] 正在生成图标...');
            try {
                execSync(`npx tauri icon "${iconPngPath}"`, { cwd: TAURI_DIR, stdio: 'pipe' });
                console.log('[打包] 图标生成成功');
            } catch (e) {
                console.error('[打包] 图标生成失败:', e.message);
            }
        }

        // 4. 修改应用名称
        const configPath = path.join(TAURI_DIR, 'src-tauri', 'tauri.conf.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config.productName = name;
        config.app.windows[0].title = name;
        config.app.windows[0].url = "index.html";
        config.app.security.csp = null;
        config.bundle.targets = ["nsis"];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('[打包] 应用名已修改:', name);

        // 5. 执行 Tauri 打包
        const command = platform === 'android'
            ? 'npm run tauri android build'
            : 'npm run tauri build';
        console.log('[打包] 开始执行:', command);

        exec(command, {
            cwd: TAURI_DIR,
            maxBuffer: 10 * 1024 * 1024,
            timeout: 600000
        }, async (error, stdout, stderr) => {
            if (error) {
                console.error('[打包] 失败:', stderr || error.message);
                return res.status(500).json({ error: '打包失败，请稍后重试' });
            }

            console.log('[打包] 成功');

            // 6. 查找生成的安装包
            let packagePath = null;

            if (platform === 'android') {
                const apkDir = path.join(TAURI_DIR, 'src-tauri', 'gen', 'android', 'app', 'build', 'outputs', 'apk', 'release');
                if (fs.existsSync(apkDir)) {
                    const files = fs.readdirSync(apkDir).filter(f => f.endsWith('.apk'));
                    const matched = files.filter(f => f.includes(name));
                    if (matched.length > 0) {
                        packagePath = path.join(apkDir, matched[0]);
                        console.log('[打包] 找到 APK:', matched[0]);
                    }
                }
            } else {
                const nsisDir = path.join(TAURI_DIR, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
                if (fs.existsSync(nsisDir)) {
                    const files = fs.readdirSync(nsisDir).filter(f => f.endsWith('.exe'));
                    const matched = files.filter(f => f.includes(name));
                    if (matched.length > 0) {
                        packagePath = path.join(nsisDir, matched[0]);
                        console.log('[打包] 找到安装包:', matched[0]);
                    }
                }
            }

            if (!packagePath) {
                return res.status(500).json({ error: '打包完成但未找到安装包文件' });
            }

            // 7. 复制到可下载的目录
            const downloadDir = path.join(__dirname, '..', 'uploads', 'packages');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }

            const ext = platform === 'android' ? '.apk' : '_setup.exe';
            const destName = name + ext;
            const destPath = path.join(downloadDir, destName);
            fs.copyFileSync(packagePath, destPath);

            const downloadUrl = '/uploads/packages/' + destName;
            console.log('[打包] 安装包已复制:', destPath);

            // 8. 保存导出记录
            const exportType = platform === 'android' ? 'android_apk' : 'windows_exe';
            await exportDB.create(req.params.projectId, req.userId, exportType, downloadUrl);

            // 9. 返回下载链接
            res.json({
                success: true,
                message: '打包完成',
                downloadUrl: downloadUrl,
                fileName: destName
            });
        });

    } catch (error) {
        console.error('[打包] 错误:', error);
        res.status(500).json({ error: '打包失败: ' + error.message });
    }
});

// 获取已打包的文件列表
router.get('/status/:projectId', authMiddleware, async (req, res) => {
    try {
        const records = await exportDB.getProjectExports(req.params.projectId);
        const packages = records.filter(r =>
            r.type === 'windows_exe' || r.type === 'android_apk'
        );
        res.json({ success: true, packages });
    } catch (error) {
        res.status(500).json({ error: '获取失败' });
    }
});

module.exports = router;