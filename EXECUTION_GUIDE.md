# GitHub + Render 部署执行指南

## 📋 执行步骤概览

本指南详细说明如何将 timeline-app 项目部署到 Render，实现免费使用自定义域名。

---

## 步骤 1：注册 Render 账号（5 分钟）

### 1.1 访问 Render 网站

1. 打开浏览器，访问：https://render.com
2. 点击右上角的 **Sign Up** 按钮
3. 选择注册方式：
   - **推荐**：使用 GitHub 账号登录
   - 或者：使用邮箱注册

### 1.2 完成注册流程

1. 填写注册信息：
   - 用户名
   - 邮箱
   - 密码

2. 验证邮箱（如果使用邮箱注册）
3. 设置密码

4. 完成注册

---

## 步骤 2：创建新的 Web Service（10 分钟）

### 2.1 进入 Render Dashboard

1. 注册完成后，会自动跳转到 Dashboard
2. 点击左侧菜单的 **Web Services**

### 2.2 创建新服务

1. 点击 **New +** 按钮
2. 选择 **Web Service**
3. 输入服务名称：`timeline-app`
4. 点击 **Create Web Service**

### 2.3 选择运行时

1. **运行时**：选择 **Node**
2. **区域**：选择 **Oregon**（或离您最近的区域）
3. 点击 **Create Web Service**

---

## 步骤 3：连接 GitHub 仓库（5 分钟）

### 3.1 进入服务配置页面

1. 创建服务后，会自动跳转到服务配置页面
2. 找到 **Build & Deploy** 部分

### 3.2 连接 GitHub

1. 点击 **Connect GitHub**
2. 如果未登录，会跳转到 GitHub 登录页面
3. 使用 GitHub 账号登录
4. 授权 Render 访问您的 GitHub 仓库

### 3.3 选择仓库和分支

1. 选择仓库：`californiafinch/timeline-app`
2. 选择分支：`main`
3. 点击 **Connect**

---

## 步骤 4：配置环境变量（5 分钟）

### 4.1 进入环境变量配置

1. 在服务配置页面，找到 **Environment** 部分
2. 点击 **Add Environment Variable**

### 4.2 添加环境变量

需要添加以下 3 个环境变量：

| 环境变量 | 值 | 说明 |
|----------|------|------|
| `SUPABASE_URL` | `https://sxjlazmnyrauiqqdjfah.supabase.co` | Supabase 项目 URL |
| `SUPABASE_KEY` | 从本地 `.env` 文件复制 | Supabase 项目 Key |
| `JWT_SECRET` | 从本地 `.env` 文件复制 | JWT 签名密钥 |
| `NODE_ENV` | `production` | 运行环境 |

**添加步骤**：
1. 在 **Key** 输入框中输入变量名（如 `SUPABASE_URL`）
2. 在 **Value** 输入框中输入对应的值
3. 点击 **Save**
4. 重复以上步骤，添加所有 4 个环境变量

**重要提示**：
- 从本地 `.env` 文件复制值时，确保复制完整
- 不要在 GitHub 中提交 `.env` 文件
- `JWT_SECRET` 应该使用强随机密钥

---

## 步骤 5：配置自定义域名（可选，10 分钟）

### 5.1 添加自定义域名

1. 在服务配置页面，找到 **Custom Domains** 部分
2. 点击 **Add Domain**

### 5.2 输入域名信息

1. 输入您的自定义域名（如 `timeline-app.com`）
2. 点击 **Add Domain**

### 5.3 配置 DNS（如果使用自定义域名）

1. 添加域名后，Render 会提供 DNS 配置信息
2. 访问您的域名注册商
3. 添加以下 DNS 记录：

| 类型 | 名称 | 值 |
|------|------|------|
| A | @ | `onrender.com`（Render 提供的服务地址） |

**注意**：
- 如果使用 Render 提供的默认域名（`timeline-app.onrender.com`），可以跳过此步骤
- 如果使用自定义域名，需要配置 DNS

---

## 步骤 6：部署服务（自动）

### 6.1 触发部署

1. 配置完环境变量后，Render 会自动检测到更改
2. 会自动开始部署流程
3. 部署完成后，会提供访问 URL

### 6.2 获取访问 URL

1. 在服务配置页面，找到 **Domains** 部分
2. 查看分配的 URL
3. 默认：`https://timeline-app.onrender.com`
4. 自定义：您配置的域名

---

## 步骤 7：更新前端 API 基础 URL（10 分钟）

### 7.1 修改 timeline-optimized.js

打开文件：`timeline-optimized.js`

找到以下代码（第 1-5 行）：

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

修改为：

```javascript
const API_BASE_URL = 'https://timeline-app.onrender.com/api';
```

### 7.2 更新所有 API 调用

需要修改以下 API 调用：

| API 端点 | 修改位置 |
|----------|--------|
| `/api/register` | 注册 API |
| `/api/login` | 登录 API |
| `/api/user` | 获取用户信息 API |
| `/api/user` (PUT) | 更新用户信息 API |
| `/api/favorites` | 获取收藏 API |
| `/api/favorites` (POST) | 添加收藏 API |
| `/api/favorites` (DELETE) | 删除收藏 API |

**修改示例**：

```javascript
// 修改前
const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, avatar })
});

// 修改后
const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, avatar })
});
```

**注意**：
- 只需要修改 `API_BASE_URL` 变量
- 其他代码不需要修改

### 7.3 测试本地服务器

1. 启动本地服务器
   ```bash
   node server.js
   ```

2. 访问：http://localhost:3000
3. 测试所有功能是否正常

---

## 步骤 8：配置 GitHub Pages 自动部署（10 分钟）

### 8.1 访问 GitHub 仓库

1. 访问：https://github.com/californiafinch/timeline-app
2. 点击 **Settings**

### 8.2 启用 GitHub Pages

1. 滚动到 **Pages** 部分
2. 点击 **Source**
3. 选择 **Deploy from a branch**
4. 选择分支：`main`
5. 点击 **Save**

**注意**：
- GitHub Pages 会自动部署 `main` 分支
- 默认访问 URL：`https://californiafinch.github.io/timeline-app/`

### 8.3 配置自定义域名（可选）

如果使用自定义域名，需要：

1. 在 **Pages** 设置中，找到 **Custom domain**
2. 输入您的自定义域名（如 `timeline-app.com`）
3. 点击 **Save**

---

## 步骤 9：测试和验证（15 分钟）

### 9.1 测试 GitHub Pages

1. 访问：`https://californiafinch.github.io/timeline-app/`
2. 测试前端页面是否正常加载
3. 测试所有功能是否正常

### 9.2 测试 Render 后端

1. 访问：`https://timeline-app.onrender.com/`
2. 测试 API 端点是否正常
3. 测试用户注册、登录、收藏功能

### 9.3 性能测试

1. 使用浏览器开发者工具（F12）
2. 查看 **Network** 标签页
3. 测试页面加载时间
4. 测试 API 响应时间

---

## 📊 预期结果

### 访问方式

| 平台 | URL | 说明 |
|------|------|------|
| **GitHub Pages** | `https://californiafinch.github.io/timeline-app/` 或自定义域名 | 静态前端 |
| **Render** | `https://timeline-app.onrender.com/` 或自定义域名 | Node.js 后端 + API |

### 性能对比

| 指标 | Vercel | GitHub Pages + Render |
|--------|----------------|--------|
| **前端加载** | 中等 | 快（全球 CDN） |
| **API 响应** | 中等 | 快（Render 优化） |
| **数据库查询** | 中等 | 快（已优化） |
| **整体性能** | 中等 | 优秀 |

---

## 🔧 故障排除

### Render 部署失败

**可能原因**：
1. 构建失败
   - 检查 `package.json` 中的依赖
   - 查看构建日志

2. 环境变量未设置
   - 检查所有环境变量是否正确配置
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
   - 查看部署日志
   - 检查文件是否正确复制

---

## 📋 检查清单

### 部署前检查

- [ ] 已注册 Render 账号
- [ ] 已创建 Web Service
- [ ] 已连接 GitHub 仓库
- [ ] 已配置所有环境变量
- [ ] 已配置自定义域名（如果需要）
- [ ] 已更新前端 API 基础 URL
- [ ] 已配置 GitHub Pages 自动部署
- [ ] 已测试本地服务器

### 部署后检查

- [ ] Render 部署成功
- [ ] GitHub Pages 部署成功
- [ ] 可以访问前端 URL
- [ ] 可以访问后端 API
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 收藏功能正常
- [ ] 页面加载时间正常

---

## 💡 重要提示

1. **环境变量安全**
   - 不要在 GitHub 中提交 `.env` 文件
   - 不要在代码中硬编码敏感信息

2. **域名配置**
   - 如果使用自定义域名，需要先在域名注册商处配置 DNS
   - DNS 生效需要 5-60 分钟

3. **备份**
   - 在修改代码前，先备份现有文件
   - 使用 Git 分支进行测试

4. **测试**
   - 每次修改后，都要测试
   - 使用浏览器开发者工具检查错误

---

## 🎯 预计完成时间

| 步骤 | 预计时间 | 累计时间 |
|------|----------|--------|
| 注册 Render 账号 | 5 分钟 | 5 分钟 |
| 创建 Web Service | 10 分钟 | 15 分钟 |
| 连接 GitHub | 5 分钟 | 20 分钟 |
| 配置环境变量 | 5 分钟 | 25 分钟 |
| 更新前端代码 | 10 分钟 | 35 分钟 |
| 配置 GitHub Pages | 10 分钟 | 45 分钟 |
| 测试和验证 | 15 分钟 | 60 分钟 |

**总计**：60-90 分钟

---

## 📞 需要帮助？

如果在执行过程中遇到问题，请提供以下信息：

1. **当前步骤**：您正在执行哪个步骤
2. **错误信息**：完整的错误消息或截图
3. **环境**：操作系统、浏览器版本
4. **已完成的步骤**：您已经完成了哪些步骤

---

## 🚀 开始执行

现在请按照上述步骤开始执行部署！

**快速开始**：
1. 访问：https://render.com
2. 注册账号并创建服务
3. 连接 GitHub 仓库
4. 配置环境变量
5. 更新前端代码
6. 配置 GitHub Pages
7. 测试所有功能

**预计完成时间**：60-90 分钟

祝您部署顺利！🎉