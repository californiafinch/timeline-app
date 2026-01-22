const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dependencies = [
    '@supabase/supabase-js@2.39.0',
    'axios@1.13.2',
    'bcryptjs@2.4.3',
    'cors@2.8.5',
    'dotenv@17.2.3',
    'express@4.18.2',
    'express-rate-limit@8.2.1',
    'jsonwebtoken@9.0.2'
];

const nodeModulesPath = path.join(__dirname, 'node_modules');

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

async function installDependencies() {
    console.log('开始手动安装依赖...');
    
    ensureDirectoryExists(nodeModulesPath);
    
    for (const dep of dependencies) {
        console.log(`正在安装 ${dep}...`);
        try {
            execSync(`npm install ${dep} --no-save --no-package-lock`, {
                stdio: 'inherit',
                cwd: __dirname
            });
            console.log(`✓ ${dep} 安装成功`);
        } catch (error) {
            console.error(`✗ ${dep} 安装失败:`, error.message);
        }
    }
    
    console.log('\n依赖安装完成！');
}

installDependencies().catch(console.error);