const { supabase, supabaseAuth } = require('./shared');

module.exports = async (req, res) => {
    console.log('[send-verification] Request received');
    
    try {
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
            res.status(200).end();
            return;
        }
        
        if (req.method !== 'POST') {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(405).json({ error: '方法不允许' });
        }
        
        const body = await parseBody(req);
        const { email } = body;

        if (!email) {
            return res.status(400).json({ error: '邮箱不能为空' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        console.log('[send-verification] Sending OTP to:', email);
        
        const { data, error } = await supabaseAuth.auth.signInWithOtp({
            email
        });

        if (error) {
            console.error('[send-verification] Error:', error);
            return res.status(500).json({ error: '发送验证码失败' });
        }

        console.log('[send-verification] Success');
        res.json({
            message: '验证码已发送',
            email
        });
    } catch (error) {
        console.error('[send-verification] Unexpected error:', error);
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