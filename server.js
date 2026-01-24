require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
// 允许所有来源的请求
app.use(cors({
    origin: '*',
    credentials: true
}));

// 处理预检请求
app.options('*', cors());

// 解析JSON请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('.'));

// 根路径路由
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/timeline.html');
});

// API路由配置
const loginHandler = require('./api/login');
const userHandler = require('./api/user');
const favoritesHandler = require('./api/favorites');

// 登录路由
app.post('/api/login', loginHandler);
app.options('/api/login', cors());

// 用户信息路由
app.get('/api/user', userHandler);
app.options('/api/user', cors());

// 收藏夹路由
app.post('/api/favorites', favoritesHandler);
app.delete('/api/favorites', favoritesHandler);
app.get('/api/favorites', favoritesHandler);
app.options('/api/favorites', cors());

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 只在本地开发环境中启动服务器
if (require.main === module) {
    // 监听所有网络接口，允许移动端访问
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
        console.log(`移动端可通过 http://[服务器IP]:${PORT} 访问`);
    });
}

// Vercel 导出
module.exports = app;
