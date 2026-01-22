const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('手动安装依赖包');
console.log('============================================================\n');

const packages = [
    'dotenv',
    '@supabase/supabase-js',
    'express',
    'cors',
    'bcryptjs',
    'jsonwebtoken',
    'express-rate-limit'
];

console.log('开始安装依赖包...\n');

let successCount = 0;
let failCount = 0;

for (const pkg of packages) {
    try {
        console.log(`正在安装: ${pkg}...`);
        execSync(`npm install ${pkg}`, { stdio: 'inherit' });
        console.log(`✓ ${pkg} 安装成功`);
        successCount++;
    } catch (error) {
        console.error(`✗ ${pkg} 安装失败:`, error.message);
        failCount++;
    }
}

console.log('\n');
console.log('============================================================');
console.log('安装结果');
console.log('============================================================\n');
console.log(`成功: ${successCount} 个`);
console.log(`失败: ${failCount} 个`);

if (failCount === 0) {
    console.log('\n✓ 所有依赖包安装成功！');
    console.log('现在可以运行服务器了...\n');
    
    try {
        console.log('正在启动服务器...\n');
        execSync('node server.js', { stdio: 'inherit' });
    } catch (error) {
        console.error('\n✗ 服务器启动失败:', error.message);
        process.exit(1);
    }
} else {
    console.log('\n⚠️  部分依赖包安装失败');
    console.log('请检查错误信息并手动解决\n');
    process.exit(1);
}