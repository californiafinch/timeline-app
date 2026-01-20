const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
    console.log('开始预热数据库连接...');
    
    try {
        const startTime = Date.now();
        
        const warmupTasks = [
            supabase.from('users').select('count', { count: 'exact', head: true }),
            supabase.from('favorites').select('count', { count: 'exact', head: true })
        ];
        
        await Promise.all(warmupTasks);
        
        const duration = Date.now() - startTime;
        
        console.log(`数据库预热完成，耗时: ${duration}ms`);
        
        res.status(200).json({
            message: 'Warmup complete',
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('预热失败:', error);
        res.status(500).json({
            error: 'Warmup failed',
            message: error.message
        });
    }
};
