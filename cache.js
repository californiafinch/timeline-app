// 缓存模块
// 使用内存缓存来存储频繁访问的数据，减少数据库查询

class Cache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 60 * 1000; // 默认缓存过期时间：1分钟
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
            expiry: now + ttl
        };
        this.cache.set(key, item);
        
        // 自动清理过期缓存
        setTimeout(() => {
            this.delete(key);
        }, ttl);
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
}

// 导出单例实例
module.exports = new Cache();
