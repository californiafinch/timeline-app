const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('错误：SUPABASE_URL 和 SUPABASE_KEY 环境变量必须设置');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createIndexes() {
    try {
        console.log('开始创建数据库索引...');

        const sqlStatements = [
            `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
            `CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);`,
            `CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);`,
            `CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id);`,
            `CREATE INDEX IF NOT EXISTS idx_favorites_user_id_type_item_id ON favorites(user_id, type, item_id);`
        ];

        for (const sql of sqlStatements) {
            console.log(`执行: ${sql}`);
            const { data, error } = await supabase.rpc('exec_sql', { sql });
            
            if (error) {
                console.error(`错误: ${error.message}`);
                console.log(`SQL: ${sql}`);
            } else {
                console.log('成功');
            }
        }

        console.log('\n索引创建完成！');
        
        console.log('\n验证索引...');
        const { data: indexes, error: indexError } = await supabase
            .from('pg_indexes')
            .select('schemaname, tablename, indexname')
            .eq('schemaname', 'public')
            .order('tablename')
            .order('indexname');

        if (indexError) {
            console.error('获取索引列表失败:', indexError.message);
        } else {
            console.log('\n当前索引列表:');
            indexes.forEach(idx => {
                console.log(`  - ${idx.tablename}.${idx.indexname}`);
            });
        }

    } catch (error) {
        console.error('创建索引失败:', error);
        process.exit(1);
    }
}

createIndexes();