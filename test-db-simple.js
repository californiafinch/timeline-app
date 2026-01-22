require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

async function testDatabase() {
    console.log('============================================================');
    console.log('Supabase 数据库连接优化测试');
    console.log('============================================================\n');

    if (!supabaseUrl || !supabaseKey) {
        console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量');
        process.exit(1);
    }

    console.log('环境变量检查:');
    console.log(`SUPABASE_URL: ✓ ${supabaseUrl}`);
    console.log(`SUPABASE_KEY: ✓ ${supabaseKey.substring(0, 20)}...`);
    console.log('\n');

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

    console.log('测试 1: 客户端初始化性能');
    console.log('------------------------------------------------------------');
    const startTime1 = Date.now();
    const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
    const initTime = Date.now() - startTime1;
    console.log(`✓ 客户端初始化完成，耗时: ${initTime}ms`);
    console.log('\n');

    console.log('测试 2: 数据库连接性能');
    console.log('------------------------------------------------------------');
    const startTime2 = Date.now();
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
    const connectTime = Date.now() - startTime2;

    if (usersError) {
        console.error('✗ 数据库连接失败:', usersError);
        process.exit(1);
    }

    console.log(`✓ 数据库连接成功，耗时: ${connectTime}ms`);
    console.log(`✓ 用户表记录数: ${users.length}`);
    console.log('\n');

    console.log('测试 3: 连接复用性能');
    console.log('------------------------------------------------------------');
    const connectionTimes = [];
    for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        const queryTime = Date.now() - startTime;
        connectionTimes.push(queryTime);
        
        if (error) {
            console.error(`✗ 查询 ${i + 1} 失败:`, error);
            process.exit(1);
        }
        
        console.log(`✓ 查询 ${i + 1} 成功，耗时: ${queryTime}ms`);
    }

    const avgTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
    const minTime = Math.min(...connectionTimes);
    const maxTime = Math.max(...connectionTimes);
    console.log(`\n平均查询时间: ${avgTime.toFixed(2)}ms`);
    console.log(`最快查询时间: ${minTime}ms`);
    console.log(`最慢查询时间: ${maxTime}ms`);
    console.log('\n');

    console.log('============================================================');
    console.log('测试结果总结');
    console.log('============================================================\n');

    console.log('性能指标:');
    console.log(`- 客户端初始化: ${initTime}ms`);
    console.log(`- 数据库连接: ${connectTime}ms`);
    console.log(`- 平均查询时间: ${avgTime.toFixed(2)}ms`);
    console.log(`- 最快查询时间: ${minTime}ms`);
    console.log(`- 最慢查询时间: ${maxTime}ms`);
    console.log('\n');

    console.log('优化效果评估:');
    if (connectTime < 1000) {
        console.log('✓ 数据库连接性能优秀（< 1s）');
    } else if (connectTime < 2000) {
        console.log('✓ 数据库连接性能良好（< 2s）');
    } else {
        console.log('⚠ 数据库连接性能需要优化（> 2s）');
    }

    if (avgTime < 100) {
        console.log('✓ 查询性能优秀（< 100ms）');
    } else if (avgTime < 500) {
        console.log('✓ 查询性能良好（< 500ms）');
    } else {
        console.log('⚠ 查询性能需要优化（> 500ms）');
    }

    console.log('\n');
    console.log('============================================================');
    console.log('测试完成！');
    console.log('============================================================');
}

testDatabase().catch(console.error);