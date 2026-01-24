const jwt = require('jsonwebtoken');
const { getSupabaseClient } = require('../supabase');

// 加载环境变量
const SECRET_KEY = process.env.JWT_SECRET;

export default async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 从请求头获取token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }

    // 验证token
    const decoded = jwt.verify(token, SECRET_KEY);

    // 获取Supabase客户端
    const clients = getSupabaseClient();
    const supabase = clients.supabase;

    // 根据请求方法处理不同的逻辑
    switch (req.method) {
      case 'GET':
        // 获取收藏内容
        const { data: favorites, error } = await supabase
          .from('favorites')
          .select('id, type, item_id')
          .eq('user_id', decoded.userId);

        if (error) {
          throw error;
        }

        // 格式化返回数据
        const userFavorites = {
          events: favorites.filter(f => f.type === 'event').map(f => f.item_id),
          characters: favorites.filter(f => f.type === 'character').map(f => f.item_id),
          years: favorites.filter(f => f.type === 'year').map(f => f.item_id)
        };

        return res.json(userFavorites);

      case 'POST':
        // 添加收藏
        const { type, id } = req.body;

        // 检查是否已存在
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

        // 添加收藏
        const { data: favorite, error: insertError } = await supabase
          .from('favorites')
          .insert([{
            user_id: decoded.userId,
            type,
            item_id: id
          }])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return res.json({ message: '收藏成功' });

      case 'DELETE':
        // 删除收藏
        const deleteData = req.body;

        // 删除收藏
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', decoded.userId)
          .eq('type', deleteData.type)
          .eq('item_id', deleteData.id);

        if (deleteError) {
          throw deleteError;
        }

        return res.json({ message: '删除成功' });

      default:
        return res.status(405).json({ error: '方法不允许' });
    }
  } catch (error) {
    console.error('收藏操作错误:', error);
    return res.status(500).json({ error: '操作失败' });
  }
};