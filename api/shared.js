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
let isInitializing = false;
let initPromise = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

function getSupabaseClient() {
    if (supabase && !isInitializing) {
        return { supabase, supabaseAuth };
    }
    
    if (isInitializing && initPromise) {
        return initPromise.then(() => ({ supabase, supabaseAuth }));
    }
    
    isInitializing = true;
    initPromise = (async () => {
        try {
            const clients = require('../supabase');
            supabase = clients.supabase;
            supabaseAuth = clients.supabaseAuth;
            
            console.log('✓ Supabase 客户端初始化成功');
            lastHealthCheck = Date.now();
            
            return { supabase, supabaseAuth };
        } catch (error) {
            console.error('✗ Supabase 客户端初始化失败:', error);
            throw error;
        } finally {
            isInitializing = false;
            initPromise = null;
        }
    })();
    
    return initPromise;
}

async function checkDatabaseHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
        return true;
    }
    
    try {
        const { supabase: client } = await getSupabaseClient();
        const { error } = await client.from('users').select('id').limit(1);
        
        if (error) {
            console.error('✗ 数据库健康检查失败:', error);
            return false;
        }
        
        lastHealthCheck = now;
        console.log('✓ 数据库健康检查通过');
        return true;
    } catch (error) {
        console.error('✗ 数据库健康检查异常:', error);
        return false;
    }
}

const queryCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;
const CACHE_SIZE = 100;

function getCacheKey(prefix, userId) {
    return `${prefix}:${userId}`;
}

function getFromCache(key) {
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCache(key, data) {
    if (queryCache.size >= CACHE_SIZE) {
        const oldestKey = queryCache.keys().next().value;
        queryCache.delete(oldestKey);
    }
    
    queryCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

function clearCache(prefix, userId) {
    const key = getCacheKey(prefix, userId);
    queryCache.delete(key);
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp >= CACHE_TTL) {
            queryCache.delete(key);
        }
    }
}, 60 * 1000);

module.exports = {
    getSupabaseClient,
    checkDatabaseHealth,
    getFromCache,
    setCache,
    clearCache,
    SECRET_KEY
};