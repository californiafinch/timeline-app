require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    console.error('错误：必须设置 JWT_SECRET 环境变量');
    throw new Error('JWT_SECRET is required');
}

let supabase = null;
let supabaseAuth = null;

function getSupabaseClient() {
    if (supabase && supabaseAuth) {
        return { supabase, supabaseAuth };
    }
    
    const clients = require('../supabase');
    supabase = clients.supabase;
    supabaseAuth = clients.supabaseAuth;
    
    console.log('✓ Supabase 客户端初始化成功');
    
    return { supabase, supabaseAuth };
}

module.exports = {
    getSupabaseClient,
    SECRET_KEY
};