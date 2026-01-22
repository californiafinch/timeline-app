const { getSupabaseClient } = require('./shared');
const bcrypt = require('bcryptjs');

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
        const { username, email, newPassword } = body;
        
        if (!username || !email || !newPassword) {
            return res.status(400).json({ error: '用户名、邮箱和新密码不能为空' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }
        
        if (newPassword.length < 8 || newPassword.length > 16) {
            return res.status(400).json({ error: '密码长度必须在8-16位之间' });
        }
        
        const { supabase } = await getSupabaseClient();
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('username', username)
            .eq('email', email)
            .single();
        
        if (error || !user) {
            return res.status(404).json({ error: '用户名或邮箱不匹配' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', user.id);
        
        if (updateError) {
            console.error('重置密码错误:', updateError);
            return res.status(500).json({ error: '重置密码失败' });
        }
        
        res.json({ success: true, message: '密码重置成功' });
    } catch (error) {
        console.error('重置密码错误:', error);
        res.status(500).json({ error: '重置密码失败' });
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