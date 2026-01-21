# GitHub Pages + Vercel 部署执行指南

## 📋 执行步骤概览

本指南详细说明如何将 timeline-app 项目部署到 GitHub Pages（前端）和 Vercel（后端），实现免费部署。

---

## 步骤 1：检查 GitHub Pages 配置（5 分钟）

### 1.1 访问 GitHub 仓库

1. 打开浏览器，访问：https://github.com/californiafinch/timeline-app
2. 点击 **Settings** 标签

### 1.2 检查 GitHub Pages 设置

1. 滚动到 **Pages** 部分
2. 确认以下配置：
   - **Source**：`Deploy from a branch`
   - **Branch**：`main` / `root`
   - **Status**：已启用

**注意**：
- GitHub Pages 应该已经启用
- 如果未启用，点击 **Save** 启用
- 默认访问 URL：`https://californiafinch.github.io/timeline-app/`

---

## 步骤 2：配置 Vercel 环境变量（10 分钟）

### 2.1 访问 Vercel Dashboard

1. 打开浏览器，访问：https://vercel.com/dashboard
2. 登录您的 Vercel 账号（使用 GitHub 登录）
3. 找到项目：`timeline-app-one`

### 2.2 进入项目设置

1. 点击项目名称进入项目详情
2. 点击顶部菜单的 **Settings** 标签
3. 在左侧菜单中找到 **Environment Variables**

### 2.3 添加环境变量

需要添加以下 3 个环境变量：

| 环境变量 | 值 | 说明 |
|----------|------|------|
| `SUPABASE_URL` | `https://sxjlazmnyrauiqqdjfah.supabase.co` | Supabase 项目 URL |
| `SUPABASE_KEY` | 从本地 `.env` 文件复制 | Supabase 项目 Key |
| `JWT_SECRET` | 从本地 `.env` 文件复制 | JWT 签名密钥 |

**添加步骤**：
1. 点击 **Add New** 按钮
2. 在 **Key** 输入框中输入变量名（如 `SUPABASE_URL`）
3. 在 **Value** 输入框中输入对应的值
4. 选择环境：`Production`、`Preview`、`Development`（全部勾选）
5. 点击 **Save**
6. 重复以上步骤，添加所有 3 个环境变量

**重要提示**：
- 从本地 `.env` 文件复制值时，确保复制完整
- 不要在 GitHub 中提交 `.env` 文件
- `JWT_SECRET` 应该使用强随机密钥

---

## 步骤 3：重新部署 Vercel 应用（5 分钟）

### 3.1 触发重新部署

1. 添加完环境变量后，返回项目详情页
2. 点击 **Deployments** 标签
3. 找到最新的部署记录
4. 点击右侧的 **...** 菜单
5. 选择 **Redeploy**

### 3.2 等待部署完成

1. Vercel 会自动开始重新部署
2. 部署过程通常需要 1-3 分钟
3. 部署完成后，状态会变为 **Ready**

### 3.3 获取访问 URL

1. 在项目详情页，查看 **Domains** 部分
2. 默认 URL：`https://timeline-app-one.vercel.app/`
3. 如果配置了自定义域名，也会显示在这里

---

## 步骤 4：更新前端 API 基础 URL（10 分钟）

### 4.1 修改 timeline-optimized.js

打开文件：`timeline-optimized.js`

找到以下代码（第 1-5 行）：

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

修改为：

```javascript
const API_BASE_URL = 'https://timeline-app-one.vercel.app/api';
```

### 4.2 更新所有 API 调用

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

### 4.3 提交并推送更改

1. 保存文件
2. 提交更改到 Git：
   ```bash
   git add timeline-optimized.js
   git commit -m "更新 API 基础 URL 为 Vercel"
   git push origin main
   ```
3. 等待 GitHub Actions 自动部署

---

## 步骤 5：测试和验证（15 分钟）

### 5.1 测试 GitHub Pages

1. 访问：`https://californiafinch.github.io/timeline-app/`
2. 测试前端页面是否正常加载
3. 检查控制台是否有错误

### 5.2 测试 Vercel 后端

1. 访问：`https://timeline-app-one.vercel.app/`
2. 测试 API 端点是否正常
3. 测试用户注册、登录、收藏功能

### 5.3 性能测试

1. 使用浏览器开发者工具（F12）
2. 查看 **Network** 标签页
3. 测试页面加载时间
4. 测试 API 响应时间

---

## 📊 预期结果

### 访问方式

| 平台 | URL | 说明 |
|------|------|------|
| **GitHub Pages** | `https://californiafinch.github.io/timeline-app/` | 静态前端 |
| **Vercel** | `https://timeline-app-one.vercel.app/` | Node.js 后端 + API |

### 性能对比

| 指标 | 本地开发 | GitHub Pages + Vercel |
|--------|----------|--------|
| **前端加载** | 快 | 快（全球 CDN） |
| **API 响应** | 快 | 快（Vercel 优化） |
| **数据库查询** | 快 | 快（已优化） |
| **整体性能** | 优秀 | 优秀 |

---

## 🔧 故障排除

### GitHub Pages 部署失败

**可能原因**：
1. 工作流失败
   - 检查 `.github/workflows/deploy-gh-pages.yml` 语法
   - 检查 GitHub Token 是否正确配置
   - 检查 permissions 设置

2. 部署失败
   - 查看部署日志
   - 检查文件是否正确复制
   - 确认分支设置正确

### Vercel 部署失败

**可能原因**：
1. 构建失败
   - 检查 `package.json` 中的依赖
   - 查看构建日志

2. 环境变量未设置
   - 检查所有环境变量是否正确配置
   - 检查变量名称是否正确
   - 确认环境变量已保存

3. 数据库连接失败
   - 检查 Supabase URL 和 Key 是否正确
   - 检查 Supabase 项目是否正常
   - 检查 JWT_SECRET 是否设置

---

## 📋 检查清单

### 部署前检查

- [x] 已注册 GitHub 账号
- [x] 已创建 GitHub 仓库
- [x] 已配置 GitHub Actions 工作流
- [x] 已修复 GitHub Actions 403 错误
- [x] 已添加 permissions 和 GITHUB_TOKEN
- [x] 已推送代码到 GitHub
- [ ] 已配置 Vercel 环境变量
- [ ] 已更新前端 API 基础 URL
- [ ] 已测试本地服务器

### 部署后检查

- [x] GitHub Actions 工作流配置成功
- [x] 代码已推送到 GitHub
- [ ] GitHub Pages 部署成功（等待 Actions 完成）
- [ ] Vercel 部署成功
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
| 检查 GitHub Pages 配置 | 5 分钟 | 5 分钟 |
| 配置 Vercel 环境变量 | 10 分钟 | 15 分钟 |
| 重新部署 Vercel 应用 | 5 分钟 | 20 分钟 |
| 更新前端 API 基础 URL | 10 分钟 | 30 分钟 |
| 测试和验证 | 15 分钟 | 45 分钟 |

**总计**：45-60 分钟

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
1. 检查 GitHub Pages 配置
2. 配置 Vercel 环境变量
3. 重新部署 Vercel 应用
4. 更新前端 API 基础 URL
5. 测试所有功能

**预计完成时间**：45-60 分钟

祝您部署顺利！🎉