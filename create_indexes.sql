-- 为 users 表添加索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 为 favorites 表添加索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id);

-- 为 favorites 表添加复合索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id_type_item_id ON favorites(user_id, type, item_id);

-- 显示索引创建结果
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;