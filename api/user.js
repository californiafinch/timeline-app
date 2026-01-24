const jwt = require('jsonwebtoken');
const { getSupabaseClient } = require('../supabase');

// 加载环境变量
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
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
    const clients = await getSupabaseClient();
    const supabase = clients.supabase;

    // 查询用户信息
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, avatar')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    return res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return res.status(401).json({ error: '未授权' });
  }
};