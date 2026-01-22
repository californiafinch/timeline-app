# 使用 npx 运行项目详细指南

**指南日期**: 2026-01-22  
**项目**: 历史年表网站  
**Node.js 版本**: v20.20.0

---

## 📋 什么是 npx？

### npx 简介

npx 是 npm 包执行器（Package Runner），可以让你在不全局安装包的情况下运行 Node.js 包。

### 优点

- ✅ 不需要全局安装包
- ✅ 不需要修改 npm 版本
- ✅ 可以直接运行项目
- ✅ 自动下载并运行所需的包
- ✅ 首次运行后使用缓存的包
- ✅ 最简单快捷

---

## 🚀 使用 npx 运行项目

### 步骤 1：打开 PowerShell 终端

1. **按 Win + R 键**
2. **输入 "powershell"**
3. **按 Enter 键**

### 步骤 2：进入项目目录

```powershell
# 进入项目目录
cd E:\Program\test01

# 验证当前目录
pwd
# 应该显示: E:\Program\test01
```

### 步骤 3：使用 npx 运行服务器

```powershell
# 使用 npx 运行服务器
npx server.js
```

**预期结果**:
- npx 会自动下载并运行所需的包
- 服务器会启动
- 可以在浏览器中访问 http://localhost:3000

---

## 📊 npx 运行过程

### 首次运行

```
npx server.js
```

**过程**:
1. npx 检查本地是否有缓存的包
2. 如果没有，从 npm 下载所需的包
3. 下载完成后，运行 server.js
4. 服务器启动，监听端口 3000

**输出示例**:
```
npx: installed 1 in 2.345s

============================================================
Supabase 客户端初始化成功
============================================================

服务器运行在 http://localhost:3000
```

### 后续运行

```
npx server.js
```

**过程**:
1. npx 使用本地缓存的包
2. 直接运行 server.js
3. 服务器启动，监听端口 3000

**输出示例**:
```
npx: 1.234s

============================================================
Supabase 客户端初始化成功
============================================================

服务器运行在 http://localhost:3000
```

---

## 🔧 常用 npx 命令

### 运行服务器

```powershell
# 运行主服务器
npx server.js
```

### 运行测试脚本

```powershell
# 运行数据库测试
npx test-db-simple.js

# 运行兼容性测试
npx test-nodejs-upgrade.js
```

### 运行其他脚本

```powershell
# 运行任何 .js 文件
npx <文件名>.js
```

---

## ⚠️ 注意事项

### 1. 首次运行时间

- 首次运行可能需要下载包
- 下载时间取决于网络速度
- 通常需要 1-5 分钟

### 2. 端口占用

如果端口 3000 被占用，会看到错误：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**:
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程
taskkill /PID <进程ID> /F
```

### 3. 环境变量

确保 `.env` 文件在项目根目录：
```
E:\Program\test01\.env
```

**必需的环境变量**:
- SUPABASE_URL
- SUPABASE_KEY
- JWT_SECRET
- NODE_ENV

### 4. 停止服务器

在 PowerShell 终端中按 `Ctrl + C` 停止服务器。

---

## ✅ 验证服务器运行

### 方法 1：使用 curl

```powershell
# 测试服务器是否运行
curl http://localhost:3000

# 预期输出
# 应该返回 HTML 内容
```

### 方法 2：使用浏览器

1. **打开浏览器**（Chrome, Edge, Firefox 等）
2. **访问**: http://localhost:3000
3. **验证**:
   - 页面正常加载
   - 时间轴显示正常
   - 可以添加收藏
   - 可以登录注册

---

## 🎯 完整工作流程

### 开发流程

```powershell
# 1. 打开 PowerShell
# 按 Win + R，输入 "powershell"

# 2. 进入项目目录
cd E:\Program\test01

# 3. 使用 npx 运行服务器
npx server.js

# 4. 验证服务器运行
# 在浏览器中访问 http://localhost:3000

# 5. 开发和测试
# 修改代码后，按 Ctrl + C 停止服务器
# 重新运行 npx server.js
```

### 调试流程

```powershell
# 1. 运行服务器
npx server.js

# 2. 查看错误信息
# 如果有错误，会在终端中显示

# 3. 修复错误

# 4. 停止服务器
# 按 Ctrl + C

# 5. 重新运行
npx server.js
```

---

## 📋 常见问题

### 问题 1：npx 命令不存在

**错误**:
```
'npx' 不是内部或外部命令，也不是可运行的程序
或批处理文件。
```

**解决方案**:
```powershell
# 安装 npx
npm install -g npx

# 或使用 npm 运行
npm run start
```

### 问题 2：端口被占用

**错误**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**:
```powershell
# 查找并结束进程
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F
```

### 问题 3：环境变量未设置

**错误**:
```
Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables
```

**解决方案**:
```powershell
# 确保 .env 文件存在
# 检查 .env 文件内容
Get-Content .env
```

### 问题 4：依赖包下载失败

**错误**:
```
npx: ERR! Error: Cannot find package 'xxx'
```

**解决方案**:
```powershell
# 检查 package.json 中的依赖
# 确保所有依赖都已列出
# 尝试手动安装依赖
npm install <包名>
```

---

## 🎉 总结

### npx 的优势

✅ **不需要全局安装**
- 可以直接运行任何 npm 包
- 避免全局包版本冲突

✅ **自动处理依赖**
- 自动下载并运行所需的包
- 使用缓存加速后续运行

✅ **最简单快捷**
- 一个命令即可运行项目
- 不需要复杂的配置

### 使用步骤

1. **打开 PowerShell 终端**
2. **进入项目目录**: `cd E:\Program\test01`
3. **运行服务器**: `npx server.js`
4. **验证运行**: 在浏览器中访问 http://localhost:3000
5. **停止服务器**: 按 `Ctrl + C`

### 下一步

- ✅ 使用 npx 运行项目
- ✅ 验证所有功能正常
- ✅ 测试用户注册和登录
- ✅ 测试收藏功能
- ✅ 部署到 Vercel

---

**指南完成日期**: 2026-01-22  
**指南人员**: AI Assistant  
**项目状态**: Node.js 20.x 已安装，可以使用 npx 运行项目