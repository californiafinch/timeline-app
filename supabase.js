const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
let supabaseAuth = null;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_KEY environment variables, using mock supabase client');
    supabase = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: null })
                })
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
                })
            }),
            update: () => ({
                eq: () => ({
                    select: () => ({
                        single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
                    })
                })
            }),
            delete: () => ({
                eq: () => Promise.resolve({ error: null })
            })
        })
    };
    supabaseAuth = {
        auth: {
            signInWithOtp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            verifyOtp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        }
    };
} else {
    // 优化的 Supabase 客户端配置（简化版本，避免自定义 fetch 导致的部署问题）
    const clientOptions = {
        db: {
            schema: 'public',
            // 优化连接池设置
            pool: {
                min: 2, // 最小连接数
                max: 25, // 最大连接数
                idleTimeoutMillis: 30000, // 空闲连接超时时间：30秒
                acquireTimeoutMillis: 5000, // 获取连接的超时时间：5秒
                createTimeoutMillis: 30000, // 创建连接的超时时间：30秒
                destroyTimeoutMillis: 5000, // 销毁连接的超时时间：5秒
                validateTimeoutMillis: 5000 // 验证连接的超时时间：5秒
            }
        },
        global: {
            headers: {
                'x-my-custom-header': 'timeline-app'
            },
            // 添加请求超时设置
            fetch: (url, options) => {
                return fetch(url, {
                    ...options,
                    signal: AbortSignal.timeout(10000) // 全局请求超时：10秒
                });
            }
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    };
    
    supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
    supabaseAuth = createClient(supabaseUrl, supabaseKey, clientOptions);
    
    console.log('✓ Supabase 客户端配置完成（已优化连接池和超时）');
}

// 导出初始化函数
function getSupabaseClient() {
    return { supabase, supabaseAuth };
}

module.exports = { supabase, supabaseAuth, getSupabaseClient };