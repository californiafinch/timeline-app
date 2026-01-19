# 数据库索引优化说明

## 概述

本文档说明如何在 Supabase 中添加数据库索引以优化查询性能。

## 索引说明

### 1. users 表索引
- **索引名**: `idx_users_username`
- **字段**: `username`
- **用途**: 优化用户登录查询
- **查询示例**: `SELECT * FROM users WHERE username = 'xxx'`

### 2. favorites 表索引

#### 单列索引
- **索引名**: `idx_favorites_user_id`
- **字段**: `user_id`
- **用途**: 优化获取用户收藏列表查询
- **查询示例**: `SELECT * FROM favorites WHERE user_id = xxx`

- **索引名**: `idx_favorites_type`
- **字段**: `type`
- **用途**: 优化按类型筛选收藏查询
- **查询示例**: `SELECT * FROM favorites WHERE type = 'event'`

- **索引名**: `idx_favorites_item_id`
- **字段**: `item_id`
- **用途**: 优化按项目 ID 查询收藏
- **查询示例**: `SELECT * FROM favorites WHERE item_id = xxx`

#### 复合索引
- **索引名**: `idx_favorites_user_id_type_item_id`
- **字段**: `user_id`, `type`, `item_id`
- **用途**: 优化检查是否已收藏的查询
- **查询示例**: `SELECT * FROM favorites WHERE user_id = xxx AND type = 'event' AND item_id = xxx`

## 执行步骤（推荐方法）

### 使用 Supabase Dashboard（最简单）

1. 登录 Supabase Dashboard
   - 访问：https://supabase.com/dashboard
   - 选择您的项目

2. 进入 SQL Editor
   - 点击左侧菜单的 **SQL Editor**
   - 点击 **New Query**

3. 复制并执行 SQL 语句
   - 复制下面的 SQL 语句
   - 粘贴到 SQL Editor
   - 点击 **Run** 执行

```sql
-- 为 users 表添加索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 为 favorites 表添加索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id);

-- 为 favorites 表添加复合索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id_type_item_id ON favorites(user_id, type, item_id);
```

4. 验证索引创建
   - 执行完成后，查看结果
   - 确认所有索引都已创建

## 验证索引

执行完 SQL 后，可以运行以下查询验证索引是否创建成功：

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## 性能提升

| 查询类型 | 优化前 | 优化后 | 提升 |
|----------|--------|--------|------|
| 用户登录 | 全表扫描 | 索引扫描 | 10-100x |
| 获取收藏 | 全表扫描 | 索引扫描 | 5-50x |
| 检查收藏 | 全表扫描 | 索引扫描 | 10-100x |
| 按类型筛选 | 全表扫描 | 索引扫描 | 5-20x |

## 注意事项

1. **索引会增加写入时间**
   - 每次插入、更新、删除都需要更新索引
   - 但查询性能提升远大于写入性能损失

2. **索引占用存储空间**
   - 每个索引都会占用额外的存储空间
   - 但存储成本很低，性能提升很大

3. **定期维护索引**
   - Supabase 会自动维护索引
   - 不需要手动优化

## 回滚索引

如果需要删除索引，可以执行以下 SQL：

```sql
-- 删除 users 表索引
DROP INDEX IF EXISTS idx_users_username;

-- 删除 favorites 表索引
DROP INDEX IF EXISTS idx_favorites_user_id;
DROP INDEX IF EXISTS idx_favorites_type;
DROP INDEX IF EXISTS idx_favorites_item_id;
DROP INDEX IF EXISTS idx_favorites_user_id_type_item_id;
```

## 监控索引使用情况

可以运行以下查询查看索引使用情况：

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## 总结

添加数据库索引可以显著提升查询性能，特别是对于：
- 用户登录查询
- 收藏列表查询
- 检查是否已收藏查询

建议在生产环境中添加这些索引，以获得最佳性能。

## 快速执行

**立即执行以下 SQL 语句到 Supabase SQL Editor**：

```sql
-- 为 users 表添加索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 为 favorites 表添加索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id);

-- 为 favorites 表添加复合索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id_type_item_id ON favorites(user_id, type, item_id);
```