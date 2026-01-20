require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';

async function testSendVerification() {
    console.log('='.repeat(60));
    console.log('测试发送邮箱验证码');
    console.log('='.repeat(60));
    console.log('');

    const testEmail = 'test@example.com';

    try {
        const response = await fetch(`${API_BASE_URL}/send-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ 发送验证码成功！');
            console.log(`邮箱: ${data.email}`);
            console.log('提示: 请检查邮箱中的验证码（6位数字）');
            console.log('');
            console.log('注意: 由于 Supabase Auth 尚未启用，此功能可能无法正常工作');
            console.log('请在 Supabase Dashboard 中启用 Email Auth');
        } else {
            console.log('❌ 发送验证码失败！');
            console.log(`错误: ${data.error}`);
        }
    } catch (error) {
        console.log('❌ 请求失败！');
        console.log(`错误: ${error.message}`);
    }

    console.log('');
    console.log('='.repeat(60));
}

async function testRegisterWithVerification() {
    console.log('='.repeat(60));
    console.log('测试注册（带验证码）');
    console.log('='.repeat(60));
    console.log('');

    const testUser = {
        username: `test${Math.floor(Math.random() * 10000)}`,
        password: 'Test1234',
        email: 'test@example.com',
        verificationCode: '123456'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
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
}

async function testRegisterWithoutVerification() {
    console.log('='.repeat(60));
    console.log('测试注册（不带验证码）');
    console.log('='.repeat(60));
    console.log('');

    const testUser = {
        username: `test${Math.floor(Math.random() * 10000)}`,
        password: 'Test1234',
        email: 'test@example.com'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
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
}

async function main() {
    console.log('');
    console.log('邮箱验证码功能测试');
    console.log('='.repeat(60));
    console.log('');

    console.log('测试场景：');
    console.log('1. 发送邮箱验证码');
    console.log('2. 注册（带验证码）');
    console.log('3. 注册（不带验证码）');
    console.log('');

    await testSendVerification();
    await testRegisterWithVerification();
    await testRegisterWithoutVerification();

    console.log('');
    console.log('='.repeat(60));
    console.log('测试完成');
    console.log('='.repeat(60));
    console.log('');

    console.log('下一步：');
    console.log('1. 在 Supabase Dashboard 中启用 Email Auth');
    console.log('2. 配置邮件模板');
    console.log('3. 测试完整流程');
    console.log('4. 部署到生产环境');
}

main().catch(error => {
    console.error('测试脚本执行失败:', error);
    process.exit(1);
});
