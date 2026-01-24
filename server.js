require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// 强制要求环境变量
const SECRET_KEY = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SECRET_KEY) {
    console.error('错误：必须设置 JWT_SECRET 环境变量');
    console.error('请在 .env 文件中添加：JWT_SECRET=your-secret-key');
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('错误：必须设置 SUPABASE_URL 和 SUPABASE_KEY 环境变量');
    console.error('请在 .env 文件中添加：');
    console.error('SUPABASE_URL=your-supabase-url');
    console.error('SUPABASE_KEY=your-supabase-key');
    process.exit(1);
}

// 懒加载 Supabase 客户端（优化版）
let supabase = null;
let supabaseAuth = null;
let isInitializing = false;
let initPromise = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟健康检查间隔

function getSupabaseClient() {
    if (supabase && !isInitializing) {
        return { supabase, supabaseAuth };
    }
    
    if (isInitializing && initPromise) {
        return initPromise.then(() => ({ supabase, supabaseAuth }));
    }
    
    isInitializing = true;
    initPromise = (async () => {
        try {
            const clients = require('./supabase');
            supabase = clients.supabase;
            supabaseAuth = clients.supabaseAuth;
            
            console.log('✓ Supabase 客户端初始化成功');
            lastHealthCheck = Date.now();
            
            return { supabase, supabaseAuth };
        } catch (error) {
            console.error('✗ Supabase 客户端初始化失败:', error);
            throw error;
        } finally {
            isInitializing = false;
            initPromise = null;
        }
    })();
    
    return initPromise;
}

async function checkDatabaseHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
        return true;
    }
    
    try {
        const { supabase: client } = await getSupabaseClient();
        const { error } = await client.from('users').select('id').limit(1);
        
        if (error) {
            console.error('✗ 数据库健康检查失败:', error);
            return false;
        }
        
        lastHealthCheck = now;
        console.log('✓ 数据库健康检查通过');
        return true;
    } catch (error) {
        console.error('✗ 数据库健康检查异常:', error);
        return false;
    }
}

async function executeWithRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await operation();
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`操作失败，重试 ${i + 1}/${maxRetries}:`, error.message);
            
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
    
    throw lastError;
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
// 允许所有来源的请求，解决CORS问题
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 处理预检请求
app.options('*', cors());

app.use(express.json());

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

// 数据库健康检查中间件
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        try {
            const isHealthy = await checkDatabaseHealth();
            if (!isHealthy) {
                return res.status(503).json({ error: '数据库连接不可用，请稍后再试' });
            }
        } catch (error) {
            console.error('数据库健康检查失败:', error);
            return res.status(503).json({ error: '数据库连接不可用，请稍后再试' });
        }
    }
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

// 用户登录
app.post('/api/login', async (req, res) => {
    // 设置响应超时，防止请求无限等待
    const timeoutId = setTimeout(() => {
        console.error('登录请求超时');
        res.status(504).json({ error: '登录超时，请稍后重试' });
    }, 8000); // 8秒超时
    
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            clearTimeout(timeoutId);
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        // 只允许特定用户登录
        const allowedUsernames = ['admin', 'finch', 'fitz'];
        if (!allowedUsernames.includes(username)) {
            clearTimeout(timeoutId);
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 正确处理getSupabaseClient返回的Promise
        const clients = getSupabaseClient();
        let supabase;
        
        // 检查是否是Promise
        if (typeof clients.then === 'function') {
            const resolvedClients = await clients;
            supabase = resolvedClients.supabase;
        } else {
            supabase = clients.supabase;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, password, email, avatar')
            .eq('username', username)
            .single();

        if (error || !user) {
            clearTimeout(timeoutId);
            console.error('用户查询失败:', error);
            return res.status(404).json({ error: '用户名或密码错误' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            clearTimeout(timeoutId);
            return res.status(401).json({ error: '密码错误' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        // 清除超时定时器
        clearTimeout(timeoutId);

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
        // 清除超时定时器
        clearTimeout(timeoutId);
        
        console.error('登录错误:', error);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({ error: '登录失败，请稍后重试' });
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
        
        // 正确处理getSupabaseClient返回的Promise
        const clients = getSupabaseClient();
        let supabase;
        
        // 检查是否是Promise
        if (typeof clients.then === 'function') {
            const resolvedClients = await clients;
            supabase = resolvedClients.supabase;
        } else {
            supabase = clients.supabase;
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

        // 正确处理getSupabaseClient返回的Promise
        const clients = getSupabaseClient();
        let supabase;
        
        // 检查是否是Promise
        if (typeof clients.then === 'function') {
            const resolvedClients = await clients;
            supabase = resolvedClients.supabase;
        } else {
            supabase = clients.supabase;
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
        
        const { supabase } = getSupabaseClient();
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

        const { supabase } = getSupabaseClient();
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

        const { supabase } = getSupabaseClient();
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

// API 404 处理
app.use((req, res) => {
    console.log('404:', req.path);
    
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: '未找到' });
    } else {
        // 非API请求让Vercel处理静态文件或返回404
        res.status(404).json({ error: '未找到' });
    }
});

// 错误处理中间件（必须放在最后）
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
