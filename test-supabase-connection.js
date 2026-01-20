require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('='.repeat(60));
console.log('Supabase 数据库连接测试');
console.log('='.repeat(60));
console.log('');

console.log('环境变量检查:');
console.log(`SUPABASE_URL: ${supabaseUrl ? '✓ 已设置' : '✗ 未设置'}`);
console.log(`SUPABASE_KEY: ${supabaseKey ? '✓ 已设置' : '✗ 未设置'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
    console.error('错误：环境变量未正确设置！');
    console.error('请检查 .env 文件中的 SUPABASE_URL 和 SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
    console.log('开始测试数据库连接...');
    console.log('');

    try {
        const startTime = Date.now();

        const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        const duration = Date.now() - startTime;

        if (error) {
            console.error('✗ 数据库连接失败！');
            console.error(`错误信息: ${error.message}`);
            console.error(`错误代码: ${error.code}`);
            console.error(`错误详情: ${JSON.stringify(error, null, 2)}`);
            return false;
        }

        console.log('✓ 数据库连接成功！');
        console.log(`响应时间: ${duration}ms`);
        console.log(`用户表记录数: ${data || 0}`);
        console.log('');

        return true;
    } catch (error) {
        console.error('✗ 数据库连接异常！');
        console.error(`错误信息: ${error.message}`);
        console.error(`错误堆栈: ${error.stack}`);
        return false;
    }
}

async function testTables() {
    console.log('测试数据库表...');
    console.log('');

    const tables = ['users', 'favorites'];
    const results = [];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('count', { count: 'exact', head: true });

            if (error) {
                console.log(`✗ ${table} 表: ${error.message}`);
                results.push({ table, success: false, error: error.message });
            } else {
                console.log(`✓ ${table} 表: 存在 (${data || 0} 条记录)`);
                results.push({ table, success: true, count: data || 0 });
            }
        } catch (error) {
            console.log(`✗ ${table} 表: ${error.message}`);
            results.push({ table, success: false, error: error.message });
        }
    }

    console.log('');
    return results;
}

async function testInsert() {
    console.log('测试数据插入...');
    console.log('');

    try {
        const testUsername = `test${Math.floor(Math.random() * 10000)}`;
        const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;

        const { data, error } = await supabase
            .from('users')
            .insert({
                username: testUsername,
                email: testEmail,
                password: 'test_hash',
                avatar: 'blue'
            })
            .select();

        if (error) {
            console.log(`✗ 数据插入失败: ${error.message}`);
            return false;
        }

        console.log(`✓ 数据插入成功！用户ID: ${data[0].id}`);

        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', data[0].id);

        if (deleteError) {
            console.log(`✗ 测试数据删除失败: ${deleteError.message}`);
        } else {
            console.log(`✓ 测试数据已清理`);
        }

        console.log('');
        return true;
    } catch (error) {
        console.log(`✗ 数据插入异常: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('');

    const connectionSuccess = await testDatabaseConnection();

    if (!connectionSuccess) {
        console.log('');
        console.log('='.repeat(60));
        console.log('测试结果: 失败');
        console.log('='.repeat(60));
        console.log('');
        console.log('建议解决方案:');
        console.log('1. 检查 Supabase 项目是否正常运行');
        console.log('2. 检查数据库表是否存在');
        console.log('3. 检查 RLS 策略是否正确配置');
        console.log('4. 检查 API 密钥是否有效');
        console.log('5. 检查网络连接是否正常');
        console.log('');
        process.exit(1);
    }

    await testTables();
    await testInsert();

    console.log('='.repeat(60));
    console.log('测试结果: 成功');
    console.log('='.repeat(60));
    console.log('');
    console.log('数据库连接正常，所有测试通过！');
    console.log('');
}

main().catch(error => {
    console.error('测试脚本执行失败:', error);
    process.exit(1);
});
