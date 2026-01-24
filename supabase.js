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
    // 优化的 Supabase 客户端配置
    const clientOptions = {
        db: {
            schema: 'public',
            // 添加连接池设置
            pool: {
                min: 0,
                max: 10,
                idleTimeoutMillis: 60000
            }
        },
        global: {
            headers: {
                'x-my-custom-header': 'timeline-app'
            },
            // 添加请求超时设置
            fetch: (url, options = {}) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
                
                const result = fetch(url, {
                    ...options,
                    signal: controller.signal
                }).finally(() => clearTimeout(timeoutId));
                
                return result;
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

module.exports = { supabase, supabaseAuth };