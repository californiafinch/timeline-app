// 缓存模块
// 使用内存缓存来存储频繁访问的数据，减少数据库查询

class Cache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 60 * 1000; // 默认缓存过期时间：1分钟
        this.maxSize = 1000; // 最大缓存条目数
        this.cleanupInterval = 30 * 1000; // 定期清理间隔：30秒
        
        // 启动定期清理任务
        this.startCleanupInterval();
    }

    /**
     * 启动定期清理任务
     */
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * 清理过期缓存
     */
    cleanup() {
        const now = Date.now();
        let deleted = 0;
        
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
                deleted++;
            }
        }
        
        // 清理超出大小限制的缓存
        if (this.cache.size > this.maxSize) {
            const entries = Array.from(this.cache.entries());
            // 按过期时间排序，删除最早过期的
            entries.sort((a, b) => a[1].expiry - b[1].expiry);
            
            while (this.cache.size > this.maxSize) {
                const [key] = entries.shift();
                this.cache.delete(key);
                deleted++;
            }
        }
        
        if (deleted > 0) {
            console.log(`缓存清理：删除了 ${deleted} 个过期条目`);
        }
    }

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（毫秒），默认1分钟
     */
    set(key, value, ttl = this.defaultTTL) {
        const now = Date.now();
        const item = {
            value,
            expiry: now + ttl,
            lastAccess: now
        };
        
        // 检查缓存大小
        if (this.cache.size >= this.maxSize) {
            // 删除最早过期的缓存
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => a[1].expiry - b[1].expiry);
            const [oldestKey] = entries.shift();
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, item);
    }

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {any|null} - 缓存值，如果缓存不存在或已过期则返回null
     */
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }
        
        const now = Date.now();
        if (now > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        // 更新最后访问时间
        item.lastAccess = now;
        this.cache.set(key, item);
        
        return item.value;
    }

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * 批量删除缓存
     * @param {string[]} keys - 缓存键数组
     */
    deleteMultiple(keys) {
        keys.forEach(key => this.cache.delete(key));
    }

    /**
     * 清空所有缓存
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 获取缓存大小
     * @returns {number} - 缓存大小
     */
    size() {
        return this.cache.size;
    }

    /**
     * 检查缓存是否存在
     * @param {string} key - 缓存键
     * @returns {boolean} - 是否存在
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }
        
        const now = Date.now();
        if (now > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * 获取缓存剩余时间
     * @param {string} key - 缓存键
     * @returns {number} - 剩余时间（毫秒），如果缓存不存在或已过期则返回0
     */
    getRemainingTTL(key) {
        const item = this.cache.get(key);
        if (!item) {
            return 0;
        }
        
        const now = Date.now();
        if (now > item.expiry) {
            this.cache.delete(key);
            return 0;
        }
        
        return item.expiry - now;
    }

    /**
     * 生成用户信息缓存键
     * @param {string} userId - 用户ID
     * @returns {string} - 缓存键
     */
    getUserCacheKey(userId) {
        return `user:${userId}`;
    }

    /**
     * 生成用户收藏缓存键
     * @param {string} userId - 用户ID
     * @returns {string} - 缓存键
     */
    getFavoritesCacheKey(userId) {
        return `favorites:${userId}`;
    }

    /**
     * 生成用户特定收藏缓存键
     * @param {string} userId - 用户ID
     * @param {string} type - 收藏类型
     * @param {string} itemId - 收藏项ID
     * @returns {string} - 缓存键
     */
    getFavoriteCacheKey(userId, type, itemId) {
        return `favorite:${userId}:${type}:${itemId}`;
    }

    /**
     * 生成批量操作缓存键前缀
     * @param {string} prefix - 前缀
     * @returns {string[]} - 匹配的缓存键数组
     */
    getKeysByPrefix(prefix) {
        const keys = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * 批量删除指定前缀的缓存
     * @param {string} prefix - 前缀
     */
    deleteByPrefix(prefix) {
        const keys = this.getKeysByPrefix(prefix);
        this.deleteMultiple(keys);
    }
}

// 导出单例实例
module.exports = new Cache();
