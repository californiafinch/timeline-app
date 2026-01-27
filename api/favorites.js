const jwt = require('jsonwebtoken');
const { getSupabaseClient } = require('../supabase');
const cache = require('../cache');

// 加载环境变量
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 设置请求超时
  const timeoutId = setTimeout(() => {
    return res.status(504).json({ error: '请求超时，请稍后重试' });
  }, 10000); // 10秒超时

  try {
    // 从请求头获取token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: '未授权' });
    }

    // 验证token
    const decoded = jwt.verify(token, SECRET_KEY);

    // 获取Supabase客户端
    const clients = getSupabaseClient();
    const supabase = clients.supabase;

    // 模拟Supabase客户端的情况处理
    if (!supabase || !supabase.from) {
      clearTimeout(timeoutId);
      return res.status(503).json({ error: '服务暂时不可用' });
    }

    // 根据请求方法处理不同的逻辑
    switch (req.method) {
      case 'GET':
        // 获取收藏内容
        try {
          // 尝试从缓存获取用户的收藏列表
          const cacheKey = cache.getFavoritesCacheKey(decoded.userId);
          const cachedFavorites = cache.get(cacheKey);
          
          if (cachedFavorites) {
            console.log('从缓存获取收藏列表');
            clearTimeout(timeoutId);
            return res.json(cachedFavorites);
          }

          const { data: favorites, error } = await Promise.race([
            supabase
              .from('favorites')
              .select('id, type, item_id')
              .eq('user_id', decoded.userId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
          ]);

          if (error) {
            console.error('获取收藏失败:', error);
            clearTimeout(timeoutId);
            return res.status(500).json({ error: '获取收藏失败' });
          }

          // 格式化返回数据
          const userFavorites = {
            events: favorites ? favorites.filter(f => f.type === 'event').map(f => f.item_id) : [],
            characters: favorites ? favorites.filter(f => f.type === 'character').map(f => f.item_id) : [],
            years: favorites ? favorites.filter(f => f.type === 'year').map(f => f.item_id) : []
          };

          // 将收藏列表存入缓存
          cache.set(cacheKey, userFavorites);
          console.log('收藏列表已缓存');

          clearTimeout(timeoutId);
          return res.json(userFavorites);
        } catch (error) {
          console.error('获取收藏错误:', error);
          clearTimeout(timeoutId);
          return res.status(500).json({ error: '获取收藏失败' });
        }

      case 'POST':
        // 添加收藏
        const { type, id } = req.body;

        if (!type || !id) {
          clearTimeout(timeoutId);
          return res.status(400).json({ error: '类型和ID不能为空' });
        }

        try {
          // 检查是否已存在
          const { data: existingFavorite, error: checkError } = await Promise.race([
            supabase
              .from('favorites')
              .select('id')
              .eq('user_id', decoded.userId)
              .eq('type', type)
              .eq('item_id', id)
              .single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
          ]);

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('检查收藏失败:', checkError);
            clearTimeout(timeoutId);
            return res.status(500).json({ error: '操作失败' });
          }

          if (existingFavorite) {
            clearTimeout(timeoutId);
            return res.json({ message: '已收藏' });
          }

          // 添加收藏
          const { data: favorite, error: insertError } = await Promise.race([
            supabase
              .from('favorites')
              .insert([{
                user_id: decoded.userId,
                type,
                item_id: id
              }])
              .select()
              .single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
          ]);

          if (insertError) {
            console.error('添加收藏失败:', insertError);
            clearTimeout(timeoutId);
            return res.status(500).json({ error: '添加收藏失败' });
          }

          // 清除相关缓存
          const favoritesCacheKey = cache.getFavoritesCacheKey(decoded.userId);
          const specificFavoriteCacheKey = cache.getFavoriteCacheKey(decoded.userId, type, id);
          cache.delete(favoritesCacheKey);
          cache.delete(specificFavoriteCacheKey);
          console.log('收藏缓存已更新');

          clearTimeout(timeoutId);
          return res.json({ message: '收藏成功' });
        } catch (error) {
          console.error('添加收藏错误:', error);
          clearTimeout(timeoutId);
          return res.status(500).json({ error: '添加收藏失败' });
        }

      case 'DELETE':
        // 删除收藏
        const deleteData = req.body;

        if (!deleteData.type || !deleteData.id) {
          clearTimeout(timeoutId);
          return res.status(400).json({ error: '类型和ID不能为空' });
        }

        try {
          // 删除收藏
          const { error: deleteError } = await Promise.race([
            supabase
              .from('favorites')
              .delete()
              .eq('user_id', decoded.userId)
              .eq('type', deleteData.type)
              .eq('item_id', deleteData.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
          ]);

          if (deleteError) {
            console.error('删除收藏失败:', deleteError);
            clearTimeout(timeoutId);
            return res.status(500).json({ error: '删除收藏失败' });
          }

          // 清除相关缓存
          const favoritesCacheKey = cache.getFavoritesCacheKey(decoded.userId);
          const specificFavoriteCacheKey = cache.getFavoriteCacheKey(decoded.userId, deleteData.type, deleteData.id);
          cache.delete(favoritesCacheKey);
          cache.delete(specificFavoriteCacheKey);
          console.log('收藏缓存已更新');

          clearTimeout(timeoutId);
          return res.json({ message: '删除成功' });
        } catch (error) {
          console.error('删除收藏错误:', error);
          clearTimeout(timeoutId);
          return res.status(500).json({ error: '删除收藏失败' });
        }

      default:
        clearTimeout(timeoutId);
        return res.status(405).json({ error: '方法不允许' });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('收藏操作错误:', error);
    return res.status(500).json({ error: '操作失败' });
  }
};