const performanceMonitor = {
    metrics: [],
    
    startMeasure(name) {
        performance.mark(`${name}-start`);
    },
    
    endMeasure(name) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name)[0];
        const duration = measure.duration;
        
        this.metrics.push({
            name,
            duration,
            timestamp: new Date().toISOString()
        });
        
        const status = duration < 500 ? '✅' : duration < 1000 ? '⚠️' : '❌';
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms ${status}`);
        
        performance.clearMarks();
        performance.clearMeasures();
    },
    
    generateReport() {
        console.log('');
        console.log('='.repeat(60));
        console.log('前端性能监控报告');
        console.log('='.repeat(60));
        console.log('');
        
        const pageLoad = performance.getEntriesByType('navigation')[0];
        if (pageLoad) {
            console.log('页面加载性能:');
            console.log(`  DOMContentLoaded: ${(pageLoad.domContentLoadedEventEnd - pageLoad.domContentLoadedEventStart).toFixed(2)}ms`);
            console.log(`  Load Complete: ${(pageLoad.loadEventEnd - pageLoad.loadEventStart).toFixed(2)}ms`);
            console.log(`  Total Load Time: ${(pageLoad.loadEventEnd - pageLoad.fetchStart).toFixed(2)}ms`);
            console.log('');
            
            const totalLoadTime = pageLoad.loadEventEnd - pageLoad.fetchStart;
            if (totalLoadTime < 2000) {
                console.log('✅ 优秀：页面加载时间 < 2s');
            } else if (totalLoadTime < 4000) {
                console.log('⚠️  良好：页面加载时间 < 4s');
            } else {
                console.log('❌ 需要优化：页面加载时间 > 4s');
            }
            console.log('');
        }
        
        const metrics = this.metrics;
        if (metrics.length > 0) {
            const durations = metrics.map(m => m.duration);
            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const maxDuration = Math.max(...durations);
            const minDuration = Math.min(...durations);
            
            console.log(`自定义指标: ${metrics.length} 个`);
            console.log(`  平均: ${avgDuration.toFixed(2)}ms`);
            console.log(`  最小: ${minDuration.toFixed(2)}ms`);
            console.log(`  最大: ${maxDuration.toFixed(2)}ms`);
            console.log('');
            
            const slowMetrics = metrics.filter(m => m.duration > 1000);
            if (slowMetrics.length > 0) {
                console.log('慢操作 (> 1s):');
                slowMetrics.forEach(m => {
                    console.log(`  - ${m.name}: ${m.duration.toFixed(2)}ms`);
                });
                console.log('');
            }
            
            if (avgDuration < 500) {
                console.log('✅ 优秀：平均操作时间 < 500ms');
            } else if (avgDuration < 1000) {
                console.log('⚠️  良好：平均操作时间 < 1s');
            } else {
                console.log('❌ 需要优化：平均操作时间 > 1s');
            }
        }
        
        console.log('');
        console.log('='.repeat(60));
        console.log('');
    }
};

if (typeof window !== 'undefined') {
    window.performanceMonitor = performanceMonitor;
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            performanceMonitor.generateReport();
        }, 1000);
    });
    
    console.log('性能监控已启用！');
    console.log('使用方法：');
    console.log('  performanceMonitor.startMeasure("操作名称");');
    console.log('  // ... 执行操作 ...');
    console.log('  performanceMonitor.endMeasure("操作名称");');
    console.log('');
    console.log('页面加载完成后将自动生成报告。');
} else {
    console.log('性能监控需要在浏览器环境中运行。');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = performanceMonitor;
}
