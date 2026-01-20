# 📋 切换到 Vercel 部署方案

## 🎯 目标
将历史年表应用从 Railway 迁移到 Vercel 部署平台，解决账户验证限制导致的部署问题。

## 📝 实施步骤

### 第一步：准备 Vercel 部署
1. 访问 Vercel 官网（https://vercel.com）
2. 使用 GitHub 账号登录或注册
3. 授权 Vercel 访问 GitHub 仓库
4. 选择 `californiafinch/timeline-app` 仓库

### 第二步：配置 Vercel 项目
1. Vercel 自动检测项目类型（Node.js）
2. 确认项目配置：
   - Framework Preset: Other
   - Root Directory: `./` 或留空
   - Build Command: `npm install`
   - Output Directory: `.` 或留空
   - Install Command: `npm install`
3. 配置环境变量：
   - `PORT=3000`
   - `SUPABASE_URL=https://sxjlazmnyrauiqqdjfah.supabase.co`
   - `SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `JWT_SECRET=h0hgXNAIAU5y8Wd18HWdMj/9tUICLXlhjvZ8+YLkbMZEg5ix2oBljsrv3tblKs2a8HDP489NvdIMeox/gHluWw==`
   - `NODE_ENV=production`

### 第三步：部署到 Vercel
1. 点击 "Deploy" 按钮开始部署
2. 等待部署完成（通常 1-2 分钟）
3. 获取 Vercel 提供的应用 URL（格式：`https://timeline-app.vercel.app`）
4. 验证应用可访问

### 第四步：测试 Vercel 应用
1. 使用测试脚本验证所有 API 端点
2. 确认数据库连接正常
3. 验证前端页面可访问
4. 测试用户注册、登录、收藏功能

### 第五步：清理 Railway 资源（可选）
1. 在 Railway 中删除 timeline-app 服务
2. 或保留服务用于备份

### 第六步：更新项目文档
1. 更新 README.md 添加 Vercel 部署说明
2. 记录新的应用 URL
3. 更新部署相关文档

## 📊 任务更新计划

### 需要完成的任务：
- [ ] 在 Vercel 创建项目并连接 GitHub 仓库
- [ ] 配置 Vercel 环境变量（5 个）
- [ ] 部署应用到 Vercel
- [ ] 测试 Vercel 应用所有功能
- [ ] 更新项目追踪列表（标记 Railway 任务为已完成）
- [ ] 添加 Vercel 相关任务到追踪列表
- [ ] 更新 README.md 文档
- [ ] 验证多设备登录和收藏同步功能

### 将标记为已完成：
- ✅ Railway 项目创建和配置
- ✅ Supabase 数据库配置
- ✅ 本地环境变量配置
- ✅ 所有 API 端点本地测试通过

## 🎯 预期结果

- ✅ 应用成功部署到 Vercel
- ✅ 获得新的公网 URL（https://timeline-app.vercel.app）
- ✅ 所有功能正常运行
- ✅ 多设备可以访问和同步收藏
- ✅ 项目追踪列表更新完成

## ⚠️ 注意事项

1. Vercel 部署通常比 Railway 更快
2. Vercel 自动 HTTPS，无需额外配置
3. 环境变量配置与 Railway 相同
4. 代码无需修改，直接使用现有代码
5. GitHub 仓库保持不变，Vercel 自动同步

## 📦 部署后应用 URL

预期 URL：`https://timeline-app.vercel.app`（或 Vercel 分配的其他域名）