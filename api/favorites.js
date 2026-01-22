const { supabase, SECRET_KEY } = require('../shared');
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
            
            res.json(userFavorites);
        } else if (req.method === 'POST') {
            const body = await parseBody(req);
            const { type, id } = body;

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

            res.json({ message: '收藏成功' });
        } else if (req.method === 'DELETE') {
            const body = await parseBody(req);
            const { type, id } = body;

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
        } else {
            res.status(405).json({ error: '方法不允许' });
        }
    } catch (error) {
        console.error('收藏操作错误:', error);
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