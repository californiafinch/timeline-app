require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量');
    process.exit(1);
}

const supabaseAuth = createClient(supabaseUrl, supabaseKey);

async function testEmailAuth() {
    console.log('========================================');
    console.log('Supabase Email Auth 功能测试');
    console.log('========================================\n');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('请输入测试邮箱地址 (默认: california_finch@outlook.com): ', async (email) => {
        rl.close();

        if (!email) {
            email = 'california_finch@outlook.com';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ 邮箱格式不正确');
            process.exit(1);
        }

        try {
            console.log('\n步骤 1: 发送验证码');
            console.log('邮箱:', email);
            console.log('正在发送...\n');

            const { data, error } = await supabaseAuth.auth.signInWithOtp({
                email: email
            });

            if (error) {
                console.error('❌ 发送验证码失败');
                console.error('错误代码:', error.code);
                console.error('错误信息:', error.message);
                console.error('\n可能的原因:');
                console.error('1. Email Auth 未启用');
                console.error('2. 邮箱地址格式不正确');
                console.error('3. Supabase 项目配置问题');
                console.error('\n建议检查:');
                console.error('- Authentication > Providers 页面');
                console.error('- Authentication > Email Templates 页面');
                console.error('- Authentication > URL Configuration 页面');
                process.exit(1);
            }

            console.log('✅ 验证码发送成功！');
            console.log('\n响应数据:');
            console.log('- Message:', data.message);
            console.log('- Type:', data.type);
            console.log('- Email:', email);

            console.log('\n========================================');
            console.log('测试结果：Email Auth 功能正常');
            console.log('========================================');
            console.log('\n下一步：');
            console.log('1. 检查邮箱收到的验证码');
            console.log('2. 在浏览器中打开注册页面');
            console.log('3. 输入邮箱并点击"发送验证码"');
            console.log('4. 输入收到的验证码');
            console.log('5. 完成注册流程');

            console.log('\n提示：');
            console.log('- 验证码通常是6位数字');
            console.log('- 验证码有效期为60秒');
            console.log('- 可以在 Supabase Dashboard 的 Logs 中查看发送记录');
            console.log('- 路径：Authentication > Logs');

        } catch (error) {
            console.error('❌ 测试失败:', error.message);
            console.error('错误详情:', error);
            process.exit(1);
        }
    });
}

testEmailAuth();