/**
 * 云端应用测试脚本
 * 用于测试 Vercel 和 GitHub Pages 混合部署的所有功能
 */

const axios = require('axios');

// 测试配置
const config = {
    // GitHub Pages 前端地址
    frontendUrl: 'https://californiafinch.github.io/timeline-app/',
    // Vercel 后端 API 地址
    backendUrl: 'https://timeline-app-one.vercel.app/api',
    // 测试用户数据
    testUser: {
        username: 'test_user_' + Date.now(),
        password: 'Test1234',
        email: `test_${Date.now()}@example.com`,
        avatar: 'blue'
    }
};

// 测试结果记录
const testResults = {
    frontend: {},
    backend: {},
    integration: {},
    performance: {}
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

// 测试函数
async function testFrontendAccessibility() {
    logSection('测试前端可访问性');
    
    try {
        const response = await axios.get(config.frontendUrl, {
            timeout: 10000
        });
        
        const success = response.status === 200;
        testResults.frontend.accessibility = success;
        logTest('前端页面可访问', success, `状态码: ${response.status}`);
        
        if (success) {
            log(`  前端地址: ${config.frontendUrl}`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.frontend.accessibility = false;
        logTest('前端页面可访问', false, error.message);
        return false;
    }
}

async function testBackendAPI() {
    logSection('测试后端 API 可访问性');
    
    try {
        const response = await axios.get(`${config.backendUrl}/`, {
            timeout: 10000
        });
        
        const success = response.status === 200;
        testResults.backend.accessibility = success;
        logTest('后端 API 可访问', success, `状态码: ${response.status}`);
        
        if (success) {
            log(`  后端地址: ${config.backendUrl}`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.backend.accessibility = false;
        logTest('后端 API 可访问', false, error.message);
        return false;
    }
}

async function testUserRegistration() {
    logSection('测试用户注册功能');
    
    try {
        const response = await axios.post(`${config.backendUrl}/register`, config.testUser, {
            timeout: 10000
        });
        
        const success = response.status === 200 && response.data.message === '注册成功';
        testResults.backend.registration = success;
        logTest('用户注册功能', success, response.data.message);
        
        if (success && response.data.user) {
            config.testUser.id = response.data.user.id;
            log(`  用户ID: ${response.data.user.id}`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.backend.registration = false;
        const errorMsg = error.response?.data?.error || error.message;
        logTest('用户注册功能', false, errorMsg);
        return false;
    }
}

async function testUserLogin() {
    logSection('测试用户登录功能');
    
    try {
        const response = await axios.post(`${config.backendUrl}/login`, {
            username: config.testUser.username,
            password: config.testUser.password
        }, {
            timeout: 10000
        });
        
        const success = response.status === 200 && response.data.token;
        testResults.backend.login = success;
        logTest('用户登录功能', success, response.data.message);
        
        if (success) {
            config.testUser.token = response.data.token;
            log(`  Token: ${response.data.token.substring(0, 20)}...`, colors.blue);
        }
        
        return success;
    } catch (error) {
        testResults.backend.login = false;
        const errorMsg = error.response?.data?.error || error.message;
        logTest('用户登录功能', false, errorMsg);
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
        const response = await axios.get(`${config.backendUrl}/user`, {
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 10000
        });
        
        const success = response.status === 200 && response.data.username;
        testResults.backend.getUserInfo = success;
        logTest('获取用户信息功能', success, `用户名: ${response.data.username}`);
        
        return success;
    } catch (error) {
        testResults.backend.getUserInfo = false;
        const errorMsg = error.response?.data?.error || error.message;
        logTest('获取用户信息功能', false, errorMsg);
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
        const response = await axios.post(`${config.backendUrl}/favorites`, {
            type: 'event',
            id: 'test_event_1'
        }, {
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 10000
        });
        
        const success = response.status === 200 && response.data.message === '收藏成功';
        testResults.backend.addFavorite = success;
        logTest('添加收藏功能', success, response.data.message);
        
        return success;
    } catch (error) {
        testResults.backend.addFavorite = false;
        const errorMsg = error.response?.data?.error || error.message;
        logTest('添加收藏功能', false, errorMsg);
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
        const response = await axios.get(`${config.backendUrl}/favorites`, {
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 10000
        });
        
        const success = response.status === 200 && response.data.events;
        testResults.backend.getFavorites = success;
        logTest('获取收藏列表功能', success, `收藏数: ${response.data.events?.length || 0}`);
        
        return success;
    } catch (error) {
        testResults.backend.getFavorites = false;
        const errorMsg = error.response?.data?.error || error.message;
        logTest('获取收藏列表功能', false, errorMsg);
        return false;
    }
}

async function testPerformance() {
    logSection('测试性能');
    
    const tests = [
        { name: '前端页面加载', url: config.frontendUrl },
        { name: '后端 API 响应', url: `${config.backendUrl}/` }
    ];
    
    for (const test of tests) {
        const startTime = Date.now();
        try {
            await axios.get(test.url, { timeout: 10000 });
            const duration = Date.now() - startTime;
            const success = duration < 3000;
            
            testResults.performance[test.name] = {
                duration,
                success
            };
            
            logTest(test.name, success, `响应时间: ${duration}ms`);
        } catch (error) {
            testResults.performance[test.name] = {
                duration: -1,
                success: false
            };
            logTest(test.name, false, error.message);
        }
    }
}

async function testCORS() {
    logSection('测试 CORS 配置');
    
    try {
        const response = await axios.options(`${config.backendUrl}/register`, {
            timeout: 10000
        });
        
        const corsHeaders = response.headers['access-control-allow-origin'];
        const success = corsHeaders && (corsHeaders.includes('californiafinch.github.io') || corsHeaders === '*');
        
        testResults.integration.cors = success;
        logTest('CORS 配置', success, `允许的来源: ${corsHeaders || '未设置'}`);
        
        return success;
    } catch (error) {
        testResults.integration.cors = false;
        logTest('CORS 配置', false, error.message);
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
    log('🚀 开始云端应用测试', colors.cyan);
    log(`前端地址: ${config.frontendUrl}`, colors.blue);
    log(`后端地址: ${config.backendUrl}`, colors.blue);
    
    // 基础可访问性测试
    await testFrontendAccessibility();
    await testBackendAPI();
    
    // 后端功能测试
    await testUserRegistration();
    await testUserLogin();
    await testGetUserInfo();
    await testAddFavorite();
    await testGetFavorites();
    
    // 集成测试
    await testCORS();
    
    // 性能测试
    await testPerformance();
    
    // 打印总结
    printSummary();
}

// 运行测试
runTests().catch(error => {
    log(`测试运行失败: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
