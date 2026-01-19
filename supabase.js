const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

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
} else {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;