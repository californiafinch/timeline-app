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

// 静态文件服务
app.use(express.static('.'));

// 根路径路由
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/timeline.html');
});

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
