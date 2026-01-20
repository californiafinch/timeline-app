# Render 迁移方案

## 📋 概述
将 timeline-app 从 Vercel 迁移到 Render，使用免费套餐，支持 Node.js 和自定义域名。

## 🎯 主要任务

### 阶段 1：准备配置文件
1. 创建 `render.yaml` - Render 部署配置文件
2. 创建 `RENDER_ENV_VARIABLES.md` - 环境变量配置文档
3. 创建 `RENDER_DEPLOYMENT_GUIDE.md` - 详细部署指南
4. 验证 `Procfile`、`package.json`、`.gitignore` 已正确配置

### 阶段 2：执行部署
1. 注册 Render 账号（使用 GitHub 登录）
2. 创建新的 Web Service
3. 连接 GitHub 仓库（californiafinch/timeline-app）
4. 配置部署设置（Node.js、npm install、node server.js）
5. 配置环境变量（JWT_SECRET、SUPABASE_URL、SUPABASE_KEY、PORT）
6. 部署应用并等待完成

### 阶段 3：配置域名
1. 使用默认域名（timeline-app.onrender.com）
2. 可选：配置自定义域名

### 阶段 4：验证和测试
1. 访问应用并测试所有功能
2. 测试 API 端点
3. 性能测试和对比

### 阶段 5：清理（可选）
1. 删除 Vercel 部署
2. 更新文档和说明

## 📋 需要创建的文件
- `render.yaml` - Render 配置
- `RENDER_ENV_VARIABLES.md` - 环境变量文档
- `RENDER_DEPLOYMENT_GUIDE.md` - 部署指南

## ✅ 预期结果
- 应用部署到 Render
- 使用免费套餐
- 可以通过 `https://timeline-app.onrender.com` 访问
- 所有功能正常工作
- 性能良好