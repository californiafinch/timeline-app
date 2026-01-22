const { supabase, supabaseAuth, SECRET_KEY } = require('../shared');
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
        const { username, password, email, avatar, verificationCode } = body;

        const usernameRegex = /^[a-zA-Z0-9_]{1,16}$/;
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({ error: '用户名只能包含字母、数字和下划线，最多16个字符' });
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: '邮箱格式不正确' });
            }
        }

        if (!password || password.length < 8 || password.length > 16) {
            return res.status(400).json({ error: '密码长度必须在8-16位之间' });
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        if (!hasUpperCase || !hasLowerCase) {
            return res.status(400).json({ error: '密码必须包含至少一位大写字母和一位小写字母' });
        }

        if (email) {
            if (!verificationCode) {
                return res.status(400).json({ error: '请先发送验证码' });
            }

            const otpRegex = /^\d{6}$/;
            if (!otpRegex.test(verificationCode)) {
                return res.status(400).json({ error: '验证码格式不正确' });
            }

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