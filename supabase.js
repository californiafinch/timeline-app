const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let supabaseAuth;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_KEY environment variables, using mock supabase client');
    supabase = {
        from: () => ({
            select: () => ({
                eq: () => ({
                    then: (resolve) => resolve({ data: [], error: null })
                })
            }),
            insert: () => ({
                select: () => ({
                    then: (resolve) => resolve({ data: null, error: new Error('Supabase not configured') })
                })
            }),
            update: () => ({
                eq: () => ({
                    then: (resolve) => resolve({ data: null, error: new Error('Supabase not configured') })
                })
            }),
            delete: () => ({
                eq: () => ({
                    then: (resolve) => resolve({ error: null })
                })
            })
        })
    };
    supabaseAuth = {
        auth: {
            signInWithOtp: () => ({ data: null, error: new Error('Supabase not configured') }),
            verifyOtp: () => ({ data: null, error: new Error('Supabase not configured') })
        }
    };
} else {
    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseAuth = createClient(supabaseUrl, supabaseKey);
}

module.exports = { supabase, supabaseAuth };