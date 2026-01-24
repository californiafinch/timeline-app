const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabaseClient } = require('../supabase');

// 加载环境变量
const SECRET_KEY = process.env.JWT_SECRET;

// 只允许特定用户登录
const allowedUsernames = ['admin', 'finch', 'fitz'];

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 验证用户名是否允许登录
    if (!allowedUsernames.includes(username)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 获取Supabase客户端
    const clients = await getSupabaseClient();
    const supabase = clients.supabase;

    // 查询用户信息
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, email, avatar')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    // 返回用户信息和token
    return res.json({
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
    return res.status(500).json({ error: '登录失败，请稍后重试' });
  }
};