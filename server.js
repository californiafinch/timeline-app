require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 强制要求 JWT_SECRET 环境变量
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error('错误：必须设置 JWT_SECRET 环境变量');
    console.error('请在 .env 文件中添加：JWT_SECRET=your-secret-key');
    process.exit(1);
}

// 懒加载 Supabase 客户端
let supabase = null;
let supabaseAuth = null;

function getSupabaseClient() {
    if (!supabase) {
        const clients = require('./supabase');
        supabase = clients.supabase;
        supabaseAuth = clients.supabaseAuth;
    }
    return { supabase, supabaseAuth };
}

// 查询缓存
const queryCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 增加到 10 分钟缓存时间
const CACHE_SIZE = 100; // 最大缓存条目数

function getCacheKey(prefix, userId) {
    return `${prefix}:${userId}`;
}

function getFromCache(key) {
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCache(key, data) {
    // 如果缓存已满，删除最旧的条目
    if (queryCache.size >= CACHE_SIZE) {
        const oldestKey = queryCache.keys().next().value;
        queryCache.delete(oldestKey);
    }
    
    queryCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

function clearCache(prefix, userId) {
    const key = getCacheKey(prefix, userId);
    queryCache.delete(key);
}

// 定期清理过期缓存
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp >= CACHE_TTL) {
            queryCache.delete(key);
        }
    }
}, 60 * 1000); // 每分钟清理一次

// 根路径路由：必须在静态文件中间件之前
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/timeline.html');
});

// 中间件配置
const allowedOrigins = [
    'http://localhost:3000',
    'https://timeline-app-one.vercel.app',
    'https://californiafinch.github.io'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('不允许的 CORS 来源'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.static('.'));

// 响应时间日志中间件
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // 监听响应完成
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // 记录慢请求（> 1 秒）
        if (duration > 1000) {
            console.log(`慢请求: ${req.method} ${req.path} - ${duration}ms`);
        }
    });
    
    next();
});

// 请求速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 限制每个 IP 100 个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// 发送邮箱验证码
app.post('/api/send-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        const { supabase, supabaseAuth } = getSupabaseClient();

        const { data, error } = await supabaseAuth.auth.signInWithOtp({
            email
        });

        if (error) {
            console.error('发送验证码失败:', error);
            return res.status(500).json({ error: '发送验证码失败' });
        }

        res.json({
            message: '验证码已发送',
            email
        });
    } catch (error) {
        console.error('发送验证码错误:', error);
        res.status(500).json({ error: '发送验证码失败' });
    }
});

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email, avatar, verificationCode } = req.body;

        // 验证用户名
        const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({ error: '用户名只能包含字母、数字和下划线，最多16个字符' });
        }

        // 验证邮箱格式
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: '邮箱格式不正确' });
            }
        }

        // 验证密码长度
        if (!password || password.length < 8 || password.length > 16) {
            return res.status(400).json({ error: '密码长度必须在8-16位之间' });
        }

        // 验证密码必须包含大小写字母
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        if (!hasUpperCase || !hasLowerCase) {
            return res.status(400).json({ error: '密码必须包含至少一位大写字母和一位小写字母' });
        }

        const { supabase, supabaseAuth } = getSupabaseClient();

        // 验证邮箱验证码（如果提供了邮箱）
        if (email) {
            if (!verificationCode) {
                return res.status(400).json({ error: '请先发送验证码' });
            }

            // 验证验证码（6位数字）
            const otpRegex = /^\d{6}$/;
            if (!otpRegex.test(verificationCode)) {
                return res.status(400).json({ error: '验证码格式不正确' });
            }

            // 使用 Supabase Auth 验证 OTP
            const { data: otpData, error: otpError } = await supabaseAuth.auth.verifyOtp({
                email,
                token: verificationCode,
                type: 'email'
            });

            if (otpError || !otpData) {
                return res.status(400).json({ error: '验证码错误或已过期' });
            }
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                username,
                password: hashedPassword,
                email: email || '',
                avatar: avatar || 'blue'
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.json({ message: '注册成功', user: { id: newUser.id, username: newUser.username } });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ error: '注册失败' });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, password, email, avatar')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: '用户未注册，请注册新账户再登录' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: '密码错误' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// 获取用户信息
app.get('/api/user', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: '未授权' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        
        const cacheKey = getCacheKey('user', decoded.userId);
        const cached = getFromCache(cacheKey);
        
        if (cached) {
            return res.json(cached);
        }
        
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, avatar')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        setCache(cacheKey, user);
        res.json(user);
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(401).json({ error: '未授权' });
    }
});

// 更新用户信息
app.put('/api/user', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: '未授权' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const { email, password, avatar } = req.body;

        const updateData = {};
        if (email !== undefined) {
            updateData.email = email;
        }
        if (password !== undefined) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }
        if (avatar !== undefined) {
            updateData.avatar = avatar;
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', decoded.userId)
            .select()
            .single();

        if (error || !user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        clearCache('user', decoded.userId);
        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({ error: '更新失败' });
    }
});

// 获取收藏内容
app.get('/api/favorites', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: '未授权' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        
        const cacheKey = getCacheKey('favorites', decoded.userId);
        const cached = getFromCache(cacheKey);
        
        if (cached) {
            return res.json(cached);
        }
        
        const { data: favorites, error } = await supabase
            .from('favorites')
            .select('id, type, item_id')
            .eq('user_id', decoded.userId);

        if (error) {
            throw error;
        }

        const userFavorites = {
            events: favorites.filter(f => f.type === 'event').map(f => f.item_id),
            characters: favorites.filter(f => f.type === 'character').map(f => f.item_id),
            years: favorites.filter(f => f.type === 'year').map(f => f.item_id)
        };
        
        setCache(cacheKey, userFavorites);
        res.json(userFavorites);
    } catch (error) {
        console.error('获取收藏错误:', error);
        res.status(401).json({ error: '未授权' });
    }
});

// 添加收藏
app.post('/api/favorites', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: '未授权' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const { type, id } = req.body;

        const { data: existingFavorite, error: checkError } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', decoded.userId)
            .eq('type', type)
            .eq('item_id', id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }

        if (existingFavorite) {
            return res.json({ message: '已收藏' });
        }

        const { data: favorite, error } = await supabase
            .from('favorites')
            .insert([{
                user_id: decoded.userId,
                type,
                item_id: id
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        clearCache('favorites', decoded.userId);
        res.json({ message: '收藏成功' });
    } catch (error) {
        console.error('添加收藏错误:', error);
        res.status(500).json({ error: '收藏失败' });
    }
});

// 删除收藏
app.delete('/api/favorites', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: '未授权' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const { type, id } = req.body;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', decoded.userId)
            .eq('type', type)
            .eq('item_id', id);

        if (error) {
            throw error;
        }

        clearCache('favorites', decoded.userId);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除收藏错误:', error);
        res.status(500).json({ error: '删除失败' });
    }
});

// 404 处理：API 请求返回 404 JSON，其他请求返回 timeline.html
app.use((req, res) => {
    console.log('404:', req.path);
    
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: '未找到' });
    } else {
        res.sendFile(__dirname + '/timeline.html');
    }
});

// 错误处理中间件（必须放在最后）
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

// 只在本地开发环境中启动服务器
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
}

// Vercel 导出
module.exports = app;
