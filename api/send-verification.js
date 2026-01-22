const { getSupabaseClient } = require('./shared');

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
        const { email } = body;

        if (!email) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        const { supabase, supabaseAuth } = await getSupabaseClient();

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