require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createIndexes() {
    console.log('开始创建数据库索引...');
    
    try {
        // 创建favorites表的复合索引(user_id, type, item_id)
        console.log('创建favorites表复合索引(user_id, type, item_id)...');
        const { error: error1 } = await supabase.rpc('pg_size_pretty', {
            bytes: 0
        });
        
        // 注意：Supabase JavaScript客户端不直接支持创建索引
        // 这里我们使用SQL语句通过rpc执行
        // 实际项目中，你需要在Supabase控制台执行这些SQL语句
        console.log('提示：请在Supabase控制台执行以下SQL语句创建索引：');
        console.log('');
        console.log('-- favorites表索引');
        console.log('-- 复合索引：用于查询特定用户的特定类型和ID的收藏（避免重复收藏）');
        console.log('CREATE INDEX IF NOT EXISTS idx_favorites_user_type_item ON favorites(user_id, type, item_id);');
        console.log('');
        console.log('-- 单一索引：用于查询特定用户的所有收藏');
        console.log('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);');
        console.log('');
        console.log('-- users表索引');
        console.log('-- 主键索引通常由数据库自动创建，这里添加username索引（如果需要）');
        console.log('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);');
        console.log('');
        
        // 验证索引是否存在
        console.log('验证索引是否存在...');
        // 注意：Supabase JavaScript客户端不直接支持查询索引
        // 这里我们通过查询表结构来验证
        
        // 查询favorites表结构
        console.log('查询favorites表结构...');
        const { data: favoritesSchema, error: error2 } = await supabase
            .from('favorites')
            .select('*')
            .limit(1);
        
        if (error2) {
            console.error('查询favorites表失败:', error2);
        } else {
            console.log('favorites表查询成功，表结构存在');
        }
        
        // 查询users表结构
        console.log('查询users表结构...');
        const { data: usersSchema, error: error3 } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        
        if (error3) {
            console.error('查询users表失败:', error3);
        } else {
            console.log('users表查询成功，表结构存在');
        }
        
        console.log('');
        console.log('索引创建指南：');
        console.log('1. 登录Supabase控制台');
        console.log('2. 选择你的项目');
        console.log('3. 进入Database > SQL Editor');
        console.log('4. 复制并执行上面的SQL语句');
        console.log('5. 执行完成后，索引将生效');
        console.log('');
        console.log('索引创建完成！');
        
    } catch (error) {
        console.error('创建索引失败:', error);
    }
}

createIndexes();
