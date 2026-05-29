const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const aiRoutes = require('./routes/ai');
const exportRoutes = require('./routes/export');
const { testConnection } = require('./lib/db');
const orderRoutes = require('./routes/order');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3001;


// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, async () => {
    console.log(`💝 Dear 服务器运行在 http://localhost:${PORT}`);
    
    try {
        const connected = await testConnection();
        if (connected) {
            console.log('✅ 数据库连接成功');
        } else {
            console.warn('⚠️ 数据库未连接，部分功能不可用');
        }
    } catch (e) {
        console.warn('⚠️ 数据库测试失败:', e.message);
    }
});