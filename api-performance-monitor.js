require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';

const performanceData = [];

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
        const data = await response.json();
        
        const record = {
            endpoint,
            method,
            status: response.status,
            duration,
            timestamp: new Date().toISOString(),
            success: response.ok
        };
        
        performanceData.push(record);
        
        const statusIcon = response.ok ? '✅' : '❌';
        console.log(`[${endpoint}] ${duration}ms - ${statusIcon}`);
        
        return { response, data, duration };
    } catch (error) {
        const duration = Date.now() - startTime;
        
        const record = {
            endpoint,
            method,
            status: 'ERROR',
            duration,
            timestamp: new Date().toISOString(),
            success: false,
            error: error.message
        };
        
        performanceData.push(record);
        
        console.log(`[${endpoint}] ${duration}ms - ❌ Error: ${error.message}`);
        
        throw error;
    }
}

function generateReport() {
    console.log('');
    console.log('='.repeat(60));
    console.log('API 性能监控报告');
    console.log('='.repeat(60));
    console.log('');
    
    const totalRequests = performanceData.length;
    const successfulRequests = performanceData.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const durations = performanceData.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)];
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];
    
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
            console.log(`  - ${r.endpoint}: ${r.duration}ms (${r.timestamp})`);
        });
        console.log('');
    }
    
    const failedRequestsList = performanceData.filter(r => !r.success);
    if (failedRequestsList.length > 0) {
        console.log('失败的请求:');
        failedRequestsList.forEach(r => {
            console.log(`  - ${r.endpoint}: ${r.error || r.status} (${r.timestamp})`);
        });
        console.log('');
    }
    
    console.log('='.repeat(60));
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
}

async function runTests() {
    console.log('开始 API 性能监控...');
    console.log('');
    
    try {
        const loginResponse = await monitorAPI('/login', 'POST', {
            username: 'testuser',
            password: 'Test1234'
        });
        
        if (loginResponse.data.token) {
            const token = loginResponse.data.token;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            await monitorAPI('/user', 'GET', null, headers);
            await monitorAPI('/favorites', 'GET', null, headers);
            
            await monitorAPI('/favorites', 'POST', {
                event_id: 1,
                character_id: 1
            }, headers);
            
            await monitorAPI('/favorites', 'GET', null, headers);
            
            await monitorAPI('/favorites', 'DELETE', {
                event_id: 1
            }, headers);
            
            await monitorAPI('/favorites', 'GET', null, headers);
        }
        
        generateReport();
    } catch (error) {
        console.error('监控脚本执行失败:', error);
        process.exit(1);
    }
}

runTests();
