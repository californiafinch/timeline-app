const { getSupabaseClient, SECRET_KEY } = require('./shared');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }
    
    try {
        const body = await parseBody(req);
        const { username, password } = body;

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        const { supabase } = await getSupabaseClient();
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
};

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}