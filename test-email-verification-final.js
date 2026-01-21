require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('错误：缺少 SUPABASE_URL 或 SUPABASE_KEY 环境变量');
    console.error('请在 .env 文件中添加：');
    console.error('SUPABASE_URL=your-supabase-url');
    console.error('SUPABASE_KEY=your-supabase-key');
    process.exit(1);
}

const supabaseAuth = createClient(supabaseUrl, supabaseKey);

async function testEmailVerification() {
    console.log('开始测试邮箱验证码功能...\n');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('请输入测试邮箱地址: ', async (testEmail) => {
        rl.close();

        if (!testEmail) {
            console.log('❌ 未输入邮箱地址');
            process.exit(1);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) {
            console.log('❌ 邮箱格式不正确');
            process.exit(1);
        }

        try {
            console.log('\n步骤 1: 发送验证码');
            console.log('邮箱:', testEmail);
            
            const { data, error } = await supabaseAuth.auth.signInWithOtp({
                email: testEmail
            });

            if (error) {
                console.error('❌ 发送验证码失败:', error.message);
                console.error('错误详情:', error);
                
                if (error.message.includes('Email not confirmed') || 
                    error.message.includes('Email provider not enabled') ||
                    error.message.includes('Email auth not enabled') ||
                    error.message.includes('Email address') && error.message.includes('invalid')) {
                    console.log('\n⚠️  Supabase Email Auth 未启用或配置不正确');
                    console.log('请按照以下步骤启用：');
                    console.log('1. 访问 https://supabase.com/dashboard');
                    console.log('2. 选择你的项目');
                    console.log('3. 进入 Authentication > Providers');
                    console.log('4. 启用 Email Provider');
                    console.log('5. 配置邮件模板（可选）');
                    console.log('6. 保存配置');
                }
                
                process.exit(1);
            }

            console.log('✅ 验证码发送成功');
            console.log('响应数据:', data);
            console.log('\n请检查邮箱（或 Supabase Dashboard 的日志）查看验证码');
            console.log('验证码通常是6位数字\n');

            console.log('步骤 2: 等待用户输入验证码');
            console.log('提示：在 Supabase Dashboard 中可以查看发送的邮件内容');
            console.log('路径：Authentication > Email Templates 或 Logs\n');

            console.log('测试完成！');
            console.log('\n下一步：');
            console.log('1. 如果 Supabase Email Auth 已启用，请手动测试发送验证码功能');
            console.log('2. 在浏览器中打开注册页面');
            console.log('3. 输入邮箱并点击"发送验证码"');
            console.log('4. 检查邮箱收到的验证码');
            console.log('5. 输入验证码并完成注册');

        } catch (error) {
            console.error('❌ 测试失败:', error);
            process.exit(1);
        }
    });
}

testEmailVerification();