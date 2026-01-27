require('dotenv').config();

// API性能监控脚本
// 测试所有API端点，收集性能数据，生成报告

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_USERNAME = process.env.TEST_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';

const performanceData = [];
const testResults = [];

async function monitorAPI(endpoint, method = 'GET', body = null, headers = null) {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: headers || {
                'Content-Type': 'application/json'
            },
            body: body ? JSON.stringify(body) : null
        });
        
        const duration = Date.now() - startTime;
        let data;
        
        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }
        
        const record = {
            endpoint,
            method,
            status: response.status,
            statusText: response.statusText,
            duration,
            timestamp: new Date().toISOString(),
            success: response.ok,
            data: data
        };
        
        performanceData.push(record);
        
        const statusIcon = response.ok ? '✅' : '❌';
        console.log(`[${endpoint}] ${duration}ms - ${statusIcon} ${response.status} ${response.statusText}`);
        
        return { response, data, duration, success: response.ok };
    } catch (error) {
        const duration = Date.now() - startTime;
        
        const record = {
            endpoint,
            method,
            status: 'ERROR',
            statusText: error.message,
            duration,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
        };
        
        performanceData.push(record);
        
        console.log(`[${endpoint}] ${duration}ms - ❌ Error: ${error.message}`);
        
        return { response: null, data: null, duration, success: false, error: error.message };
    }
}

function generateReport() {
    console.log('');
    console.log('='.repeat(80));
    console.log('API 性能监控报告');
    console.log('='.repeat(80));
    console.log('');
    
    const totalRequests = performanceData.length;
    const successfulRequests = performanceData.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const durations = performanceData.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length || 0;
    const maxDuration = Math.max(...durations) || 0;
    const minDuration = Math.min(...durations) || 0;
    
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)] || 0;
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0;
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0;
    
    console.log(`总请求数: ${totalRequests}`);
    console.log(`成功请求: ${successfulRequests} (${(successfulRequests / totalRequests * 100).toFixed(2)}%)`);
    console.log(`失败请求: ${failedRequests} (${(failedRequests / totalRequests * 100).toFixed(2)}%)`);
    console.log('');
    console.log(`平均响应时间: ${avgDuration.toFixed(2)}ms`);
    console.log(`最小响应时间: ${minDuration}ms`);
    console.log(`最大响应时间: ${maxDuration}ms`);
    console.log('');
    console.log(`P50 响应时间: ${p50}ms`);
    console.log(`P95 响应时间: ${p95}ms`);
    console.log(`P99 响应时间: ${p99}ms`);
    console.log('');
    
    const slowRequests = performanceData.filter(r => r.duration > 1000);
    if (slowRequests.length > 0) {
        console.log('慢请求 (> 1s):');
        slowRequests.forEach(r => {
            console.log(`  - ${r.endpoint} (${r.method}): ${r.duration}ms (${r.status} ${r.statusText})`);
        });
        console.log('');
    }
    
    const failedRequestsList = performanceData.filter(r => !r.success);
    if (failedRequestsList.length > 0) {
        console.log('失败的请求:');
        failedRequestsList.forEach(r => {
            console.log(`  - ${r.endpoint} (${r.method}): ${r.error || `${r.status} ${r.statusText}`}`);
        });
        console.log('');
    }
    
    // 按端点分组统计
    const endpointStats = {};
    performanceData.forEach(record => {
        const key = `${record.endpoint} (${record.method})`;
        if (!endpointStats[key]) {
            endpointStats[key] = {
                total: 0,
                successful: 0,
                failed: 0,
                durations: []
            };
        }
        
        endpointStats[key].total++;
        if (record.success) {
            endpointStats[key].successful++;
        } else {
            endpointStats[key].failed++;
        }
        endpointStats[key].durations.push(record.duration);
    });
    
    console.log('按端点分组统计:');
    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
        const avgDuration = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length || 0;
        const successRate = (stats.successful / stats.total * 100).toFixed(2);
        console.log(`  - ${endpoint}: ${successRate}% 成功, 平均响应时间: ${avgDuration.toFixed(2)}ms`);
    });
    console.log('');
    
    console.log('='.repeat(80));
    console.log('');
    
    console.log('性能评估:');
    if (avgDuration < 500) {
        console.log('✅ 优秀：平均响应时间 < 500ms');
    } else if (avgDuration < 1000) {
        console.log('⚠️  良好：平均响应时间 < 1s');
    } else {
        console.log('❌ 需要优化：平均响应时间 > 1s');
    }
    
    if (p95 < 1000) {
        console.log('✅ 优秀：P95 响应时间 < 1s');
    } else if (p95 < 2000) {
        console.log('⚠️  良好：P95 响应时间 < 2s');
    } else {
        console.log('❌ 需要优化：P95 响应时间 > 2s');
    }
    
    if (failedRequests === 0) {
        console.log('✅ 优秀：无失败请求');
    } else if (failedRequests / totalRequests < 0.05) {
        console.log('⚠️  良好：失败率 < 5%');
    } else {
        console.log('❌ 需要优化：失败率 > 5%');
    }
    
    console.log('');
    
    // 生成测试结果
    const testResult = {
        timestamp: new Date().toISOString(),
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: (successfulRequests / totalRequests * 100).toFixed(2),
        avgDuration: avgDuration.toFixed(2),
        minDuration,
        maxDuration,
        p50,
        p95,
        p99,
        endpointStats: endpointStats,
        slowRequests: slowRequests.length,
        failedRequestsList: failedRequestsList.map(r => ({
            endpoint: r.endpoint,
            method: r.method,
            error: r.error || `${r.status} ${r.statusText}`
        }))
    };
    
    testResults.push(testResult);
    
    // 保存测试结果到文件
    const fs = require('fs');
    const resultsFile = 'api-performance-results.json';
    
    try {
        let existingResults = [];
        if (fs.existsSync(resultsFile)) {
            const existingData = fs.readFileSync(resultsFile, 'utf8');
            existingResults = JSON.parse(existingData);
        }
        
        existingResults.push(testResult);
        
        // 只保留最近100条记录
        if (existingResults.length > 100) {
            existingResults = existingResults.slice(-100);
        }
        
        fs.writeFileSync(resultsFile, JSON.stringify(existingResults, null, 2));
        console.log(`测试结果已保存到 ${resultsFile}`);
    } catch (error) {
        console.error('保存测试结果失败:', error);
    }
    
    return testResult;
}

async function runTests() {
    console.log('开始 API 性能监控测试...');
    console.log(`测试API基础URL: ${API_BASE_URL}`);
    console.log('');
    
    try {
        // 测试登录
        console.log('测试登录API...');
        const loginResponse = await monitorAPI('/login', 'POST', {
            username: TEST_USERNAME,
            password: TEST_PASSWORD
        });
        
        if (loginResponse.success && loginResponse.data && loginResponse.data.token) {
            const token = loginResponse.data.token;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            console.log('');
            console.log('测试用户API...');
            // 测试获取用户信息
            await monitorAPI('/user', 'GET', null, headers);
            
            console.log('');
            console.log('测试收藏API...');
            // 测试获取收藏列表
            await monitorAPI('/favorites', 'GET', null, headers);
            
            // 测试添加收藏（使用有效的UUID格式）
            await monitorAPI('/favorites', 'POST', {
                type: 'event',
                id: '123e4567-e89b-12d3-a456-426614174000'
            }, headers);
            
            // 再次测试获取收藏列表
            await monitorAPI('/favorites', 'GET', null, headers);
            
            // 测试删除收藏（使用有效的UUID格式）
            await monitorAPI('/favorites', 'DELETE', {
                type: 'event',
                id: '123e4567-e89b-12d3-a456-426614174000'
            }, headers);
            
            // 再次测试获取收藏列表
            await monitorAPI('/favorites', 'GET', null, headers);
        } else {
            console.error('登录失败，无法测试需要认证的API端点');
        }
        
        console.log('');
        console.log('测试完成，生成报告...');
        console.log('');
        
        const report = generateReport();
        return report;
    } catch (error) {
        console.error('监控脚本执行失败:', error);
        process.exit(1);
    }
}

// 支持命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log('API性能监控脚本');
    console.log('用法: node api-performance-monitor.js [选项]');
    console.log('');
    console.log('选项:');
    console.log('  --help, -h    显示帮助信息');
    console.log('  --url <url>   指定API基础URL');
    console.log('  --username <username> 指定测试用户名');
    console.log('  --password <password> 指定测试密码');
    console.log('  --silent, -s  静默模式，只输出报告');
    console.log('');
    process.exit(0);
}

// 解析命令行参数
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && i + 1 < args.length) {
        API_BASE_URL = args[i + 1];
    } else if (args[i] === '--username' && i + 1 < args.length) {
        TEST_USERNAME = args[i + 1];
    } else if (args[i] === '--password' && i + 1 < args.length) {
        TEST_PASSWORD = args[i + 1];
    }
}

// 运行测试
runTests();

module.exports = {
    runTests,
    monitorAPI,
    generateReport
};
