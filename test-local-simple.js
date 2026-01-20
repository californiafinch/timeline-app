/**
 * 简单本地应用测试脚本
 * 不依赖外部包，使用 Node.js 内置模块
 */

const http = require('http');

// 测试配置
const config = {
    localUrl: 'http://localhost:3000',
    testUser: {
        username: 'test_user_' + Date.now(),
        password: 'Test1234',
        email: `test_${Date.now()}@example.com`,
        avatar: 'blue'
    }
};

// 测试结果记录
const testResults = {
    localServer: {},
    backend: {}
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// 工具函数
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.cyan);
    console.log('='.repeat(60) + '\n');
}

function logTest(name, status, details = '') {
    const icon = status ? '✓' : '✗';
    const color = status ? colors.green : colors.red;
    log(`${icon} ${name}`, color);
    if (details) {
        log(`  ${details}`, colors.yellow);
    }
}

// HTTP 请求函数
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// 测试函数
async function testLocalServer() {
    logSection('测试本地服务器');
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 5000
        });
        
        const success = response.statusCode === 200;
        testResults.localServer.running = success;
        logTest('本地服务器运行', success, `状态码: ${response.statusCode}`);
        
        if (success) {
            log(`  本地地址: ${config.localUrl}`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.localServer.running = false;
        logTest('本地服务器运行', false, error.message);
        return false;
    }
}

async function testUserRegistration() {
    logSection('测试用户注册功能');
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: config.testUser,
            timeout: 5000
        });
        
        const success = response.statusCode === 200 && response.data.message === '注册成功';
        testResults.backend.registration = success;
        logTest('用户注册功能', success, response.data.message);
        
        if (success && response.data.user) {
            config.testUser.id = response.data.user.id;
            log(`  用户ID: ${response.data.user.id}`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.backend.registration = false;
        logTest('用户注册功能', false, error.message);
        return false;
    }
}

async function testUserLogin() {
    logSection('测试用户登录功能');
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                username: config.testUser.username,
                password: config.testUser.password
            },
            timeout: 5000
        });
        
        const success = response.statusCode === 200 && response.data.token;
        testResults.backend.login = success;
        logTest('用户登录功能', success, response.data.message);
        
        if (success) {
            config.testUser.token = response.data.token;
            log(`  Token: ${response.data.token.substring(0, 20)}...`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.backend.login = false;
        logTest('用户登录功能', false, error.message);
        return false;
    }
}

async function testGetUserInfo() {
    logSection('测试获取用户信息功能');
    
    if (!config.testUser.token) {
        logTest('获取用户信息功能', false, '未登录，无 Token');
        return false;
    }
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/user',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 5000
        });
        
        const success = response.statusCode === 200 && response.data.username;
        testResults.backend.getUserInfo = success;
        logTest('获取用户信息功能', success, `用户名: ${response.data.username}`);
        
        return success;
    } catch (error) {
        testResults.backend.getUserInfo = false;
        logTest('获取用户信息功能', false, error.message);
        return false;
    }
}

async function testAddFavorite() {
    logSection('测试添加收藏功能');
    
    if (!config.testUser.token) {
        logTest('添加收藏功能', false, '未登录，无 Token');
        return false;
    }
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/favorites',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.testUser.token}`
            },
            body: {
                type: 'event',
                id: 'test_event_1'
            },
            timeout: 5000
        });
        
        const success = response.statusCode === 200 && response.data.message === '收藏成功';
        testResults.backend.addFavorite = success;
        logTest('添加收藏功能', success, response.data.message);
        
        return success;
    } catch (error) {
        testResults.backend.addFavorite = false;
        logTest('添加收藏功能', false, error.message);
        return false;
    }
}

async function testGetFavorites() {
    logSection('测试获取收藏列表功能');
    
    if (!config.testUser.token) {
        logTest('获取收藏列表功能', false, '未登录，无 Token');
        return false;
    }
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/favorites',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 5000
        });
        
        const success = response.statusCode === 200 && response.data.events;
        testResults.backend.getFavorites = success;
        logTest('获取收藏列表功能', success, `收藏数: ${response.data.events?.length || 0}`);
        
        return success;
    } catch (error) {
        testResults.backend.getFavorites = false;
        logTest('获取收藏列表功能', false, error.message);
        return false;
    }
}

function printSummary() {
    logSection('测试总结');
    
    const totalTests = Object.values(testResults).reduce((acc, cat) => acc + Object.keys(cat).length, 0);
    const passedTests = Object.values(testResults).reduce((acc, cat) => acc + Object.values(cat).filter(v => v === true).length, 0);
    const failedTests = totalTests - passedTests;
    
    log(`总测试数: ${totalTests}`, colors.cyan);
    log(`通过测试: ${passedTests}`, colors.green);
    log(`失败测试: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);
    log(`成功率: ${((passedTests / totalTests) * 100).toFixed(2)}%`, colors.cyan);
    
    console.log('\n详细结果:');
    console.log(JSON.stringify(testResults, null, 2));
}

// 主测试流程
async function runTests() {
    log('🚀 开始本地应用测试', colors.cyan);
    log(`本地地址: ${config.localUrl}`, colors.blue);
    
    // 基础测试
    await testLocalServer();
    
    // 后端功能测试
    await testUserRegistration();
    await testUserLogin();
    await testGetUserInfo();
    await testAddFavorite();
    await testGetFavorites();
    
    // 打印总结
    printSummary();
}

// 运行测试
runTests().catch(error => {
    log(`测试运行失败: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
