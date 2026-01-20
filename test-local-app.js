/**
 * 本地应用测试脚本
 * 用于测试本地服务器和前端功能
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

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
    frontend: {},
    backend: {},
    integration: {}
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
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
async function testLocalServer() {
    logSection('测试本地服务器');
    
    try {
        const response = await axios.get(config.localUrl, {
            timeout: 5000
        });
        
        const success = response.status === 200;
        testResults.localServer.running = success;
        logTest('本地服务器运行', success, `状态码: ${response.status}`);
        
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

async function testFrontendLoading() {
    logSection('测试前端页面加载');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        const startTime = Date.now();
        
        await page.goto(config.localUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        const loadTime = Date.now() - startTime;
        
        // 检查关键元素
        const timeline = await page.$('#timeline');
        const searchInput = await page.$('#searchInput');
        const categoryFilter = await page.$('#categoryFilter');
        const loginBtn = await page.$('#loginBtn');
        
        const success = timeline && searchInput && categoryFilter && loginBtn;
        testResults.frontend.loading = success;
        testResults.frontend.loadTime = loadTime;
        
        logTest('前端页面加载', success, `加载时间: ${loadTime}ms`);
        logTest('时间轴元素', !!timeline);
        logTest('搜索输入框', !!searchInput);
        logTest('分类筛选器', !!categoryFilter);
        logTest('登录按钮', !!loginBtn);
        
        await browser.close();
        return success;
    } catch (error) {
        testResults.frontend.loading = false;
        logTest('前端页面加载', false, error.message);
        await browser.close();
        return false;
    }
}

async function testUserRegistration() {
    logSection('测试用户注册功能');
    
    try {
        const response = await axios.post(`${config.localUrl}/api/register`, config.testUser, {
            timeout: 5000
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
        const response = await axios.post(`${config.localUrl}/api/login`, {
            username: config.testUser.username,
            password: config.testUser.password
        }, {
            timeout: 5000
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
        const response = await axios.get(`${config.localUrl}/api/user`, {
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 5000
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
        const response = await axios.post(`${config.localUrl}/api/favorites`, {
            type: 'event',
            id: 'test_event_1'
        }, {
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 5000
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
        const response = await axios.get(`${config.localUrl}/api/favorites`, {
            headers: {
                'Authorization': `Bearer ${config.testUser.token}`
            },
            timeout: 5000
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

async function testTimelineRendering() {
    logSection('测试时间轴渲染');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto(config.localUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // 检查时间轴元素
        const timelineEvents = await page.$$('.timeline-event');
        const timelineYears = await page.$$('.timeline-year-marker');
        
        const success = timelineEvents.length > 0 && timelineYears.length > 0;
        testResults.frontend.timelineRendering = success;
        
        logTest('时间轴渲染', success, `事件数: ${timelineEvents.length}, 年份数: ${timelineYears.length}`);
        
        await browser.close();
        return success;
    } catch (error) {
        testResults.frontend.timelineRendering = false;
        logTest('时间轴渲染', false, error.message);
        await browser.close();
        return false;
    }
}

async function testSearchFunctionality() {
    logSection('测试搜索功能');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto(config.localUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // 输入搜索词
        await page.type('#searchInput', '秦始皇');
        await page.click('#searchBtn');
        
        // 等待搜索结果
        await page.waitForTimeout(1000);
        
        // 检查是否有搜索结果
        const timelineEvents = await page.$$('.timeline-event');
        
        const success = timelineEvents.length > 0;
        testResults.frontend.search = success;
        logTest('搜索功能', success, `搜索结果数: ${timelineEvents.length}`);
        
        await browser.close();
        return success;
    } catch (error) {
        testResults.frontend.search = false;
        logTest('搜索功能', false, error.message);
        await browser.close();
        return false;
    }
}

async function testCategoryFilter() {
    logSection('测试分类筛选功能');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto(config.localUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // 选择政治分类
        await page.select('#categoryFilter', 'political');
        await page.waitForTimeout(1000);
        
        // 检查筛选结果
        const timelineEvents = await page.$$('.timeline-event');
        
        const success = timelineEvents.length > 0;
        testResults.frontend.categoryFilter = success;
        logTest('分类筛选功能', success, `筛选结果数: ${timelineEvents.length}`);
        
        await browser.close();
        return success;
    } catch (error) {
        testResults.frontend.categoryFilter = false;
        logTest('分类筛选功能', false, error.message);
        await browser.close();
        return false;
    }
}

async function testZoomFunctionality() {
    logSection('测试缩放功能');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto(config.localUrl, {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // 获取初始缩放级别
        const initialZoom = await page.$eval('#zoomLevel', el => el.textContent);
        
        // 点击放大按钮
        await page.click('#zoomInBtn');
        await page.waitForTimeout(500);
        
        // 获取放大后的缩放级别
        const zoomedIn = await page.$eval('#zoomLevel', el => el.textContent);
        
        // 点击缩小按钮
        await page.click('#zoomOutBtn');
        await page.waitForTimeout(500);
        
        // 获取缩小后的缩放级别
        const zoomedOut = await page.$eval('#zoomLevel', el => el.textContent);
        
        const success = initialZoom !== zoomedIn && zoomedIn !== zoomedOut;
        testResults.frontend.zoom = success;
        
        logTest('缩放功能', success, `初始: ${initialZoom}, 放大: ${zoomedIn}, 缩小: ${zoomedOut}`);
        
        await browser.close();
        return success;
    } catch (error) {
        testResults.frontend.zoom = false;
        logTest('缩放功能', false, error.message);
        await browser.close();
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
    
    // 前端测试
    await testFrontendLoading();
    await testTimelineRendering();
    await testSearchFunctionality();
    await testCategoryFilter();
    await testZoomFunctionality();
    
    // 后端测试
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
