const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email, avatar } = req.body;

        // 验证用户名
        if (!username || username.length > 16) {
            return res.status(400).json({ error: '用户名不能为空且最多16个字符' });
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
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
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
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, avatar')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: '用户不存在' });
        }

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
        const { data: favorites, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', decoded.userId);

        if (error) {
            throw error;
        }

        const userFavorites = {
            events: favorites.filter(f => f.type === 'event').map(f => f.item_id),
            characters: favorites.filter(f => f.type === 'character').map(f => f.item_id),
            years: favorites.filter(f => f.type === 'year').map(f => f.item_id)
        };

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
            .select('*')
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

        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除收藏错误:', error);
        res.status(500).json({ error: '删除失败' });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
