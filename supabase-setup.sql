-- 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(16) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar VARCHAR(50) DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 创建 favorites 表
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('event', 'character', 'year')),
  item_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type, item_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type);

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 创建 users 表的 RLS 策略
-- 允许任何人注册
CREATE POLICY "Allow public registration" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许用户查看自己的信息
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  TO anon
  USING (true);

-- 允许用户更新自己的信息
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  TO anon
  USING (true);

-- 创建 favorites 表的 RLS 策略
-- 允许用户查看自己的收藏
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT
  TO anon
  USING (true);

-- 允许用户添加收藏
CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 允许用户删除自己的收藏
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE
  TO anon
  USING (true);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 users 表创建触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
