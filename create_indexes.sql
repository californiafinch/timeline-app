-- 创建数据库索引，优化查询性能

-- favorites表索引
-- 复合索引：用于查询特定用户的特定类型和ID的收藏（避免重复收藏）
CREATE INDEX IF NOT EXISTS idx_favorites_user_type_item ON favorites(user_id, type, item_id);

-- 单一索引：用于查询特定用户的所有收藏
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- users表索引
-- 主键索引通常由数据库自动创建，这里添加username索引（如果需要）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 查看所有索引
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';
