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

    // 简化的测试用例：允许特定用户使用任意密码登录
    if (allowedUsernames.includes(username)) {
      // 生成测试用JWT token
      const token = jwt.sign(
        { userId: '1', username: username },
        SECRET_KEY,
        { expiresIn: '7d' }
      );

      // 返回测试用户信息和token
      return res.json({
        message: '登录成功',
        token,
        user: {
          id: '1',
          username: username,
          email: `${username}@example.com`,
          avatar: 'blue'
        }
      });
    }

    // 用户名不在允许列表中
    return res.status(401).json({ error: '用户名或密码错误' });
  } catch (error) {
    console.error('登录错误:', error);
    return res.status(500).json({ error: '登录失败，请稍后重试' });
  }
};