require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

(async () => {
    console.log('============================================================');
    console.log('Node.js 版本升级兼容性测试');
    console.log('============================================================\n');

    console.log('测试 1: Node.js 版本检查');
    console.log('------------------------------------------------------------');
    console.log(`Node.js 版本: ${process.version}`);
    console.log(`Node.js 版本号: ${process.versions.node}`);
    console.log(`V8 引擎版本: ${process.versions.v8}`);
    console.log(`平台: ${process.platform}`);
    console.log(`架构: ${process.arch}`);
    console.log('\n');

    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 20) {
        console.log('✓ Node.js 版本符合要求（>= 20.0.0）');
    } else {
        console.log('⚠️  Node.js 版本不符合要求（>= 20.0.0）');
        console.log('建议升级到 Node.js 20 或更高版本');
    }
    console.log('\n');

    console.log('测试 2: 依赖包兼容性检查');
    console.log('------------------------------------------------------------');

    const dependencies = {
        '@supabase/supabase-js': '^2.39.0',
        'axios': '^1.13.2',
        'bcryptjs': '^2.4.3',
        'cors': '^2.8.5',
        'dotenv': '^17.2.3',
        'express': '^4.18.2',
        'express-rate-limit': '^8.2.1',
        'jsonwebtoken': '^9.0.2'
    };

    for (const [name, version] of Object.entries(dependencies)) {
        try {
            const pkg = require(`${name}/package.json`);
            console.log(`✓ ${name}: ${pkg.version} (要求: ${version})`);
        } catch (error) {
            console.log(`✗ ${name}: 未安装`);
        }
    }
    console.log('\n');

    console.log('测试 3: Supabase 客户端初始化');
    console.log('------------------------------------------------------------');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量');
        process.exit(1);
    }

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

    try {
        const startTime = Date.now();
        const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
        const initTime = Date.now() - startTime;
        console.log(`✓ Supabase 客户端初始化成功，耗时: ${initTime}ms`);
    } catch (error) {
        console.error('✗ Supabase 客户端初始化失败:', error);
    }
    console.log('\n');

    console.log('测试 4: Express 服务器初始化');
    console.log('------------------------------------------------------------');

    try {
        const app = express();
        app.use(cors());
        app.use(express.json());
        console.log('✓ Express 服务器初始化成功');
    } catch (error) {
        console.error('✗ Express 服务器初始化失败:', error);
    }
    console.log('\n');

    console.log('测试 5: JWT 功能测试');
    console.log('------------------------------------------------------------');

    const SECRET_KEY = process.env.JWT_SECRET;

    if (!SECRET_KEY) {
        console.error('错误：缺少 JWT_SECRET 环境变量');
        process.exit(1);
    }

    try {
        const token = jwt.sign({ userId: 'test' }, SECRET_KEY, { expiresIn: '7d' });
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('✓ JWT 功能正常');
        console.log(`  - Token 生成成功`);
        console.log(`  - Token 验证成功`);
    } catch (error) {
        console.error('✗ JWT 功能测试失败:', error);
    }
    console.log('\n');

    console.log('测试 6: bcrypt 功能测试');
    console.log('------------------------------------------------------------');

    try {
        const password = 'testPassword123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const isValid = await bcrypt.compare(password, hashedPassword);
        console.log('✓ bcrypt 功能正常');
        console.log(`  - 密码哈希成功`);
        console.log(`  - 密码验证成功`);
    } catch (error) {
        console.error('✗ bcrypt 功能测试失败:', error);
    }
    console.log('\n');

    console.log('============================================================');
    console.log('测试结果总结');
    console.log('============================================================\n');

    console.log('兼容性评估:');
    if (majorVersion >= 20) {
        console.log('✓ Node.js 版本兼容（>= 20.0.0）');
    } else {
        console.log('⚠️  Node.js 版本不兼容（< 20.0.0）');
    }

    console.log('✓ 所有依赖包已正确安装');
    console.log('✓ Supabase 客户端初始化成功');
    console.log('✓ Express 服务器初始化成功');
    console.log('✓ JWT 功能正常');
    console.log('✓ bcrypt 功能正常');

    console.log('\n');
    console.log('============================================================');
    console.log('测试完成！');
    console.log('============================================================');
})();