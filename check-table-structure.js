require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
    console.log('='.repeat(60));
    console.log('检查数据库表结构');
    console.log('='.repeat(60));
    console.log('');

    const tables = ['users', 'favorites'];

    for (const table of tables) {
        console.log(`表名: ${table}`);
        console.log('-'.repeat(60));

        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.error(`错误: ${error.message}`);
            } else if (data && data.length > 0) {
                console.log('列名:');
                const columns = Object.keys(data[0]);
                columns.forEach(col => {
                    console.log(`  - ${col}`);
                });
                console.log('');
                console.log('示例数据:');
                console.log(JSON.stringify(data[0], null, 2));
            } else {
                console.log('表为空，无法确定列结构');
            }
        } catch (error) {
            console.error(`异常: ${error.message}`);
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('');
    }
}

checkTableStructure().catch(error => {
    console.error('检查失败:', error);
    process.exit(1);
});
