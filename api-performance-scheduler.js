require('dotenv').config();

// API性能监控调度脚本
// 使用node-cron设置定时任务，定期运行性能监控脚本

const cron = require('node-cron');
const { runTests } = require('./api-performance-monitor');

console.log('启动API性能监控调度器...');
console.log('当前时间:', new Date().toISOString());
console.log('');

// 配置监控频率
// 默认为每小时运行一次
//  cron表达式格式: 秒 分 时 日 月 周
const MONITOR_CRON_SCHEDULE = process.env.MONITOR_CRON_SCHEDULE || '0 0 * * * *'; // 每小时运行一次

console.log(`监控频率: ${MONITOR_CRON_SCHEDULE}`);
console.log('');

// 立即运行一次测试
console.log('立即运行一次性能测试...');
runTests().then(() => {
    console.log('初始测试完成');
    console.log('');
    console.log('开始定期监控...');
    console.log('');
}).catch(error => {
    console.error('初始测试失败:', error);
    console.log('');
    console.log('开始定期监控...');
    console.log('');
});

// 设置定时任务
const task = cron.schedule(MONITOR_CRON_SCHEDULE, async () => {
    console.log('========================================');
    console.log('定时性能测试开始:', new Date().toISOString());
    console.log('========================================');
    
    try {
        await runTests();
        console.log('定时性能测试完成:', new Date().toISOString());
        console.log('========================================');
        console.log('');
    } catch (error) {
        console.error('定时性能测试失败:', error);
        console.log('========================================');
        console.log('');
    }
}, {
    scheduled: true,
    timezone: 'Asia/Shanghai' // 使用上海时区
});

console.log('API性能监控调度器已启动');
console.log('按 Ctrl+C 停止监控');
console.log('');

// 优雅退出
process.on('SIGINT', () => {
    console.log('正在停止API性能监控调度器...');
    task.stop();
    console.log('API性能监控调度器已停止');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('正在停止API性能监控调度器...');
    task.stop();
    console.log('API性能监控调度器已停止');
    process.exit(0);
});
