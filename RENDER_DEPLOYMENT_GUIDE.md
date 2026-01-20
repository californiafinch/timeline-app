# Render 部署指南

## 概述

本文档说明如何将 timeline-app 项目部署到 Render，实现免费使用自定义域名。

## 架构说明

```
┌─────────────┐
│  GitHub Pages │
│  (静态前端)  │
└─────────────┘
       │
       ▼
┌─────────────┐
│    Render    │
│  (后端服务)  │
└─────────────┘
       │
       ▼
┌─────────────┐
│  用户浏览器  │
└─────────────┘
```

## 部署步骤

### 步骤 1：注册 Render 账号

1. 访问：https://render.com
2. 点击右上角的 **Sign Up**
3. 使用 GitHub 账号登录
4. 完成注册流程

### 步骤 2：创建新服务

1. 登录 Render Dashboard
2. 点击 **New +**
3. 选择 **Web Service**
4. 输入服务名称：`timeline-app`
5. 点击 **Create Web Service**

### 步骤 3：连接 GitHub 仓库

1. 在服务配置页面
2. 找到 **Build & Deploy** 部分
3. 点击 **Connect GitHub**
4. 授权 GitHub 访问
5. 选择仓库：`californiafinch/timeline-app`
6. 选择分支：`main`

### 步骤 4：配置环境变量

1. 在服务配置页面
2. 找到 **Environment** 部分
3. 添加以下环境变量：

| 环境变量 | 值 | 说明 |
|----------|------|------|
| `SUPABASE_URL` | `https://sxjlazmnyrauiqqdjfah.supabase.co` | Supabase 项目 URL |
| `SUPABASE_KEY` | 从本地 `.env` 文件复制 | Supabase 项目 Key |
| `JWT_SECRET` | 从本地 `.env` 文件复制 | JWT 签名密钥 |
| `NODE_ENV` | `production` | 运行环境 |

**注意**：
- 不要在 GitHub 中提交 `.env` 文件
- 从本地 `.env` 文件复制值时，确保复制完整

### 步骤 5：配置自定义域名

1. 在服务配置页面
2. 找到 **Custom Domains** 部分
3. 点击 **Add Domain**
4. 输入您的自定义域名（如 `timeline-app.com`）
5. 点击 **Add Domain**

**注意**：
- 域名需要先在域名注册商处配置 DNS 记录
- 指向到 Render 的服务地址（Render 会提供）

### 步骤 6：部署服务

1. 在服务配置页面
2. 点击 **Deploy**
3. 等待部署完成
4. 部署完成后，Render 会提供访问 URL

### 步骤 7：配置 GitHub Pages

#### 方法 1：使用 GitHub Actions（推荐）

1. 访问：https://github.com/californiafinch/timeline-app
2. 点击 **Settings**
3. 滚动到 **Pages** 部分
4. 点击 **Source**
5. 选择 **Deploy from a branch**
6. 选择分支：`main`
7. 点击 **Save**

**注意**：
- GitHub Pages 会自动部署 `main` 分支
- 默认 URL：`https://californiafinch.github.io/timeline-app/`

#### 方法 2：手动部署

1. 克隆仓库到本地
2. 创建 `gh-pages` 分支
3. 切换到 `gh-pages` 分支
4. 复制所有文件到根目录（排除 `server.js`、`package.json` 等）
5. 提交并推送

### 步骤 8：更新前端代码

修改 `timeline-optimized.js` 中的 API 基础 URL：

```javascript
// 修改前
const API_BASE_URL = 'http://localhost:3000/api';

// 修改后
const API_BASE_URL = 'https://timeline-app.onrender.com/api';
```

**需要修改的 API 调用**：
- `/api/register`
- `/api/login`
- `/api/user`
- `/api/favorites`

### 步骤 9：测试

1. 测试 GitHub Pages
   - 访问：`https://californiafinch.github.io/timeline-app/`
   - 测试前端功能

2. 测试 Render
   - 访问：`https://timeline-app.onrender.com/`
   - 测试 API 连接
   - 测试用户注册、登录、收藏功能

3. 性能测试
   - 使用浏览器开发者工具
   - 测试页面加载时间
   - 测试 API 响应时间

## 域名配置

### DNS 配置

如果您购买了自定义域名（如 `timeline-app.com`），需要配置 DNS：

1. 登录域名注册商
2. 添加 A 记录：
   - 类型：`A`
   - 名称：`@`
   - 值：`onrender.com`（Render 提供的服务地址）

3. 等待 DNS 生效（通常 5-60 分钟）

### 环境变量获取

#### Render 环境变量

| 环境变量 | 说明 |
|----------|------|
| `SUPABASE_URL` | Supabase 项目 URL |
| `SUPABASE_KEY` | Supabase 项目 Key |
| `JWT_SECRET` | JWT 签名密钥 |
| `NODE_ENV` | 运行环境 |

**注意**：
- Render 会自动注入这些环境变量
- 无需在代码中硬编码

#### GitHub Secrets

| Secret 名称 | 说明 |
|-----------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token（用于自动部署） |

**配置步骤**：
1. 访问：https://github.com/settings/tokens
2. 点击 **Generate new token**
3. 选择权限：`repo`（仓库读写权限）
4. 复制生成的 token
5. 访问：https://github.com/californiafinch/timeline-app/settings/secrets/actions
6. 点击 **New repository secret**
7. 名称：`GITHUB_TOKEN`
8. 粘贴 token
9. 点击 **Add secret**

## 故障排除

### Render 部署失败

**可能原因**：
1. 构建失败
   - 检查 `package.json` 中的依赖
   - 检查 `render.yaml` 配置
   - 查看构建日志

2. 环境变量未设置
   - 检查环境变量是否正确配置
   - 检查变量名称是否正确

3. 数据库连接失败
   - 检查 Supabase URL 和 Key 是否正确
   - 检查 Supabase 项目是否正常

### GitHub Pages 部署失败

**可能原因**：
1. 工作流失败
   - 检查 `.github/workflows/deploy.yml` 语法
   - 检查 GitHub Token 是否正确配置

2. 部署失败
   - 检查 `gh-pages` 分支是否存在
   - 检查文件是否正确复制

## 性能优化建议

### Render 优化

1. **启用缓存**
   - 在 `render.yaml` 中添加缓存配置
   - 使用 Redis 或 Memcached

2. **使用 CDN**
   - 配置静态资源 CDN
   - 提高全球访问速度

3. **优化数据库查询**
   - 使用 Supabase 的查询优化功能
   - 添加数据库索引

## 成本说明

### Render 免费套餐

- **构建时间**：15 分钟
- **内存**：512 MB
- **CPU**：0.5 vCPU
- **带宽**：100 GB/月
- **持久存储**：0 GB

### 升级选项

如果需要更多资源：
- 升级到 Starter（$7/月）
- 升级到 Standard（$25/月）
- 升级到 Pro（$50/月）

## 总结

使用 Render 部署可以获得：
- ✅ 免费托管
- ✅ 支持自定义域名
- ✅ 支持 Node.js 后端
- ✅ 自动部署
- ✅ 全球 CDN
- ✅ 良好的性能

**预计总成本**：$0/月（免费套餐）

## 快速开始

1. 注册 Render 账号
2. 创建新服务并连接 GitHub
3. 配置环境变量
4. 部署服务
5. 配置 GitHub Pages 自动部署
6. 更新前端 API 基础 URL
7. 测试所有功能

**预计完成时间**：1-2 小时