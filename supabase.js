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
    const clientOptions = {
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'x-my-custom-header': 'timeline-app'
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
    
    console.log('✓ Supabase 客户端配置完成');
}

module.exports = { supabase, supabaseAuth };