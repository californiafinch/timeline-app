require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { createClient: createAuthClient } = require('@supabase/supabase-js');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error('错误：必须设置 JWT_SECRET 环境变量');
    throw new Error('JWT_SECRET is required');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('错误：必须设置 SUPABASE_URL 和 SUPABASE_KEY 环境变量');
    throw new Error('SUPABASE_URL and SUPABASE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAuth = createAuthClient(supabaseUrl, supabaseKey);

console.log('✓ Supabase 客户端初始化成功');

module.exports = {
    supabase,
    supabaseAuth,
    SECRET_KEY
};