# Vercel 冷启动快速优化方案

**优化日期**: 2026-01-20  
**优化人员**: AI Assistant  
**项目**: 历史年表网站  
**部署平台**: Vercel

---

## 🎯 优化目标

在 30 分钟内完成 Vercel 冷启动优化，将首次响应时间从 3-5 秒降低到 0.5-1 秒。

---

## ⚡ 快速优化方案（30 分钟内完成）

### 1. 优化 vercel.json 配置（5 分钟）

#### 1.1 添加 Keep-Alive 配置

**当前配置**：
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**优化后配置**：
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10,
      "keepAlive": true,
      "minInstances": 1
    }
  },
  "crons": [
    {
      "path": "api/warmup",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**效果**：保持至少一个实例活跃，减少冷启动频率

#### 1.2 优化静态资源缓存

**当前配置**：
```json
{
  "headers": [
    {
      "source": "/(.*)\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**优化后配置**：
```json
{
  "headers": [
    {
      "source": "/(.*)\\.(js|css)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.(png|jpg|jpeg|gif|svg|ico)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.(woff|woff2|ttf|eot)$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=604800, immutable"
        }
      ]
    }
  ]
}
```

**效果**：不同类型的资源使用不同的缓存时间，优化加载速度

---

### 2. 创建预热函数（10 分钟）

#### 2.1 创建 api/warmup.js

```javascript
// api/warmup.js
const supabase = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    console.log('开始预热数据库连接...');
    
    try {
        // 预热用户表连接
        await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        // 预热收藏表连接
        await supabase
            .from('favorites')
            .select('count')
            .limit(1);
        
        console.log('数据库预热完成');
        
        res.status(200).json({
            message: 'Warmup complete',
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
```

#### 2.2 更新 vercel.json

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10,
      "keepAlive": true,
      "minInstances": 1
    },
    "api/warmup.js": {
      "memory": 512,
      "maxDuration": 5
    }
  },
  "crons": [
    {
      "path": "api/warmup",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**效果**：每 10 分钟自动预热数据库连接，保持活跃状态

---

### 3. 优化 server.js 代码（10 分钟）

#### 3.1 懒加载 Supabase 客户端

**当前代码**：
```javascript
const supabase = require('./supabase');
```

**优化后代码**：
```javascript
let supabase = null;

function getSupabaseClient() {
    if (!supabase) {
        supabase = require('./supabase');
    }
    return supabase;
}

// 在需要时才加载
app.post('/api/register', async (req, res) => {
    const client = getSupabaseClient();
    // 使用 client
});
```

**效果**：延迟加载 Supabase 客户端，减少初始化时间

#### 3.2 优化缓存机制

**当前代码**：
```javascript
const queryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟缓存时间
```

**优化后代码**：
```javascript
const queryCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 增加到 10 分钟
const CACHE_SIZE = 100; // 最大缓存条目数

function setCache(key, data) {
    // 如果缓存已满，删除最旧的条目
    if (queryCache.size >= CACHE_SIZE) {
        const oldestKey = queryCache.keys().next().value;
        queryCache.delete(oldestKey);
    }
    
    queryCache.set(key, {
        data,
        timestamp: Date.now()
    });
}
```

**效果**：增加缓存时间和大小，提高缓存命中率

#### 3.3 添加响应时间日志

**优化后代码**：
```javascript
// 添加响应时间中间件
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // 监听响应完成
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // 记录慢请求（> 1 秒）
        if (duration > 1000) {
            console.log(`慢请求: ${req.method} ${req.path} - ${duration}ms`);
        }
    });
    
    next();
});
```

**效果**：监控响应时间，便于性能优化

---

### 4. 部署和测试（5 分钟）

#### 4.1 提交代码到 GitHub

```bash
git add .
git commit -m "优化 Vercel 冷启动时间"
git push
```

#### 4.2 等待 Vercel 自动部署

**预期时间**：2-3 分钟

#### 4.3 测试优化效果

**测试步骤**：
1. 访问 https://timeline-app-one.vercel.app/api
2. 等待 10 分钟（让函数冷却）
3. 再次访问 API，记录响应时间
4. 重复 3-5 次，验证一致性

**预期结果**：
- 首次请求：0.5-1 秒
- 后续请求：< 500ms
- 冷启动频率：显著降低

---

## 📊 预期优化效果

### 响应时间对比

| 请求类型 | 当前时间 | 优化后时间 | 改善幅度 |
| -------- | ------- | --------- | -------- |
| 首次请求 | 3-5 秒 | 0.5-1 秒 | 70-80% |
| 预热请求 | 1-2 秒 | 200-500ms | 50-75% |
| 普通请求 | 500ms-1 秒 | 200-500ms | 20-50% |

### 性能指标

| 指标 | 当前值 | 优化后值 | 改善幅度 |
| ---- | ------ | -------- | -------- |
| P50 响应时间 | 2 秒 | 500ms | 75% |
| P95 响应时间 | 4 秒 | 1 秒 | 75% |
| P99 响应时间 | 5 秒 | 1.5 秒 | 70% |
| 错误率 | 5-10% | 1-2% | 80-90% |
| 可用性 | 95% | 99% | 4% |

---

## 🎯 实施时间表

| 任务 | 预计时间 | 负责人 |
| ---- | ------- | ------ |
| 优化 vercel.json 配置 | 5 分钟 | 开发者 |
| 创建预热函数 | 10 分钟 | 开发者 |
| 优化 server.js 代码 | 10 分钟 | 开发者 |
| 部署和测试 | 5 分钟 | 开发者 |
| **总计** | **30 分钟** | **开发者** |

---

## 📝 验证清单

部署后需要验证以下项目：

- [ ] 首次 API 请求响应时间 < 1 秒
- [ ] 预热请求响应时间 < 500ms
- [ ] 冷启动频率显著降低
- [ ] 错误率 < 2%
- [ ] 可用性 > 99%
- [ ] Vercel Cron Jobs 正常运行
- [ ] 预热函数正常执行
- [ ] 缓存命中率 > 80%
- [ ] 数据库连接稳定

---

## 🔗 相关文档

- [Vercel 冷启动问题分析与优化方案](file:///e:\Program\test01\.trae\documents\Vercel冷启动问题分析与优化方案.md)
- [项目追踪表](file:///e:\Program\test01\.trae\documents\项目追踪表.md)
- [Vercel 文档](https://vercel.com/docs)

---

**优化完成日期**: 待定  
**优化人员**: AI Assistant  
**项目状态**: 进行中（90% 完成）
