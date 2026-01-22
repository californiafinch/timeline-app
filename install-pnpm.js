const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

console.log('开始下载 pnpm...');

const platform = os.platform();
const arch = os.arch();

let pnpmUrl;
let pnpmFileName;

if (platform === 'win32') {
    pnpmUrl = 'https://github.com/pnpm/pnpm/releases/download/v8.15.6/pnpm-win-x64.exe';
    pnpmFileName = 'pnpm-win-x64.exe';
} else if (platform === 'darwin') {
    if (arch === 'arm64') {
        pnpmUrl = 'https://github.com/pnpm/pnpm/releases/download/v8.15.6/pnpm-darwin-arm64';
        pnpmFileName = 'pnpm-darwin-arm64';
    } else {
        pnpmUrl = 'https://github.com/pnpm/pnpm/releases/download/v8.15.6/pnpm-darwin-x64';
        pnpmFileName = 'pnpm-darwin-x64';
    }
} else {
    if (arch === 'arm64') {
        pnpmUrl = 'https://github.com/pnpm/pnpm/releases/download/v8.15.6/pnpm-linux-arm64';
        pnpmFileName = 'pnpm-linux-arm64';
    } else {
        pnpmUrl = 'https://github.com/pnpm/pnpm/releases/download/v8.15.6/pnpm-linux-x64';
        pnpmFileName = 'pnpm-linux-x64';
    }
}

const pnpmDir = path.join(os.homedir(), '.pnpm');
const pnpmPath = path.join(pnpmDir, pnpmFileName);

console.log('正在从 ' + pnpmUrl + ' 下载...');
console.log('目标路径: ' + pnpmPath);

if (!fs.existsSync(pnpmDir)) {
    fs.mkdirSync(pnpmDir, { recursive: true });
}

const file = fs.createWriteStream(pnpmPath);

const options = {
    rejectUnauthorized: false
};

https.get(pnpmUrl, options, (response) => {
    if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, options, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('✓ pnpm 下载成功');
                
                if (platform === 'win32') {
                    fs.chmodSync(pnpmPath, '755');
                }
                
                console.log('正在验证 pnpm...');
                try {
                    execSync('"' + pnpmPath + '" --version', { stdio: 'inherit' });
                    console.log('✓ pnpm 安装成功！');
                    console.log('\n请将 ' + pnpmDir + ' 添加到系统 PATH 环境变量中');
                    console.log('然后运行: pnpm install');
                } catch (error) {
                    console.error('✗ pnpm 验证失败:', error.message);
                    process.exit(1);
                }
            });
        }).on('error', (err) => {
            fs.unlink(pnpmPath, () => {});
            console.error('✗ 下载失败:', err.message);
            process.exit(1);
        });
    } else {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('✓ pnpm 下载成功');
            
            if (platform === 'win32') {
                fs.chmodSync(pnpmPath, '755');
            }
            
            console.log('正在验证 pnpm...');
            try {
                execSync('"' + pnpmPath + '" --version', { stdio: 'inherit' });
                console.log('✓ pnpm 安装成功！');
                console.log('\n请将 ' + pnpmDir + ' 添加到系统 PATH 环境变量中');
                console.log('然后运行: pnpm install');
            } catch (error) {
                console.error('✗ pnpm 验证失败:', error.message);
                process.exit(1);
            }
        });
    }
}).on('error', (err) => {
    fs.unlink(pnpmPath, () => {});
    console.error('✗ 下载失败:', err.message);
    process.exit(1);
});