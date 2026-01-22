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
    
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: '未授权' });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        
        if (req.method === 'GET') {
            const { supabase } = await getSupabaseClient();
            const { data: user, error } = await supabase
                .from('users')
                .select('id, username, email, avatar')
                .eq('id', decoded.userId)
                .single();

            if (error || !user) {
                return res.status(404).json({ error: '用户不存在' });
            }

            res.json(user);
        } else if (req.method === 'PUT') {
            const body = await parseBody(req);
            const { email, password, avatar } = body;

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

            const { supabase } = await getSupabaseClient();
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
        } else {
            res.status(405).json({ error: '方法不允许' });
        }
    } catch (error) {
        console.error('用户操作错误:', error);
        res.status(401).json({ error: '未授权' });
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