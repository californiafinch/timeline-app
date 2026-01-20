require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';

async function testLogin() {
    console.log('='.repeat(60));
    console.log('测试登录功能');
    console.log('='.repeat(60));
    console.log('');

    const testCases = [
        {
            name: '测试用户登录',
            username: 'testuser',
            password: 'Test1234'
        },
        {
            name: '错误用户名',
            username: 'wronguser',
            password: 'Test1234'
        },
        {
            name: '错误密码',
            username: 'testuser',
            password: 'WrongPassword'
        }
    ];

    for (const testCase of testCases) {
        console.log(`测试: ${testCase.name}`);
        console.log(`用户名: ${testCase.username}`);
        console.log(`密码: ${testCase.password}`);
        console.log('-'.repeat(60));

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: testCase.username,
                    password: testCase.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ 登录成功！');
                console.log(`Token: ${data.token.substring(0, 50)}...`);
                console.log(`用户信息:`, JSON.stringify(data.user, null, 2));
            } else {
                console.log('❌ 登录失败！');
                console.log(`错误: ${data.error}`);
            }
        } catch (error) {
            console.log('❌ 请求失败！');
            console.log(`错误: ${error.message}`);
            console.log('');
            console.log('可能的原因:');
            console.log('1. 服务器未运行');
            console.log('2. 端口 3000 被占用');
            console.log('3. 防火墙阻止连接');
            console.log('4. 网络连接问题');
        }

        console.log('');
        console.log('='.repeat(60));
        console.log('');
    }
}

async function testRegister() {
    console.log('='.repeat(60));
    console.log('测试注册功能');
    console.log('='.repeat(60));
    console.log('');

    const randomNum = Math.floor(Math.random() * 10000);
    const newUser = {
        username: `test${randomNum}`,
        password: 'Test1234',
        email: `test${randomNum}@example.com`,
        avatar: 'blue'
    };

    console.log(`用户名: ${newUser.username}`);
    console.log(`密码: ${newUser.password}`);
    console.log(`邮箱: ${newUser.email}`);
    console.log('-'.repeat(60));

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ 注册成功！');
            console.log(`用户ID: ${data.user.id}`);
            console.log(`用户名: ${data.user.username}`);
        } else {
            console.log('❌ 注册失败！');
            console.log(`错误: ${data.error}`);
        }
    } catch (error) {
        console.log('❌ 请求失败！');
        console.log(`错误: ${error.message}`);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('');
}

async function main() {
    console.log('');
    console.log('API 功能测试脚本');
    console.log('API URL:', API_BASE_URL);
    console.log('');

    // 测试注册
    await testRegister();

    // 测试登录
    await testLogin();
}

main().catch(error => {
    console.error('测试脚本执行失败:', error);
    process.exit(1);
});
