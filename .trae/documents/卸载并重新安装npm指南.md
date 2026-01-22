# 卸载并重新安装 npm 详细指南

**指南日期**: 2026-01-22  
**问题**: 全局 npm 与 Node.js 20.x 不兼容

---

## 🔧 解决方案 1：手动删除并重新安装 npm（推荐）

### 步骤 1：删除全局 npm 目录

```powershell
# 删除全局 npm 目录
Remove-Item -Recurse -Force $env:APPDATA\npm

# 或使用完整路径
Remove-Item -Recurse -Force "C:\Users\$env:USERNAME\AppData\Roaming\npm"
```

### 步骤 2：下载最新 npm

1. **访问 npm 官网**
   - URL: https://npmjs.org/
   - 点击 "Download Node.js and npm" 按钮

2. **下载 npm 安装包**
   - 选择 "Windows Installer (.msi) 64-bit"
   - 保存到本地

### 步骤 3：安装 npm

1. **运行安装程序**
   - 双击下载的 .msi 文件
   - 按照安装向导完成安装
   - 勾选 "Add to PATH"

2. **重启 PowerShell 终端**
   - 关闭当前终端
   - 重新打开 PowerShell

### 步骤 4：验证 npm 安装

```powershell
# 检查 npm 版本
npm --version

# 应该显示最新版本
```

### 步骤 5：重新安装项目依赖

```powershell
# 进入项目目录
cd E:\Program\test01

# 重新安装依赖
npm install

# 验证安装
npm list
```

### 步骤 6：运行项目

```powershell
# 运行服务器
node server.js

# 或使用 npx
npx server.js
```

---

## 🔧 解决方案 2：使用 yarn（备选）

### 步骤 1：全局安装 yarn

```powershell
# 使用 npm 全局安装 yarn
npm install -g yarn
```

### 步骤 2：使用 yarn 安装项目依赖

```powershell
# 进入项目目录
cd E:\Program\test01

# 使用 yarn 安装依赖
yarn install

# 验证安装
yarn list
```

### 步骤 3：使用 yarn 运行项目

```powershell
# 使用 yarn 运行项目
yarn start

# 或直接运行
node server.js
```

---

## 🔧 解决方案 3：使用 node 直接运行（临时方案）

如果 npm 问题持续存在，可以尝试直接使用 node 运行：

```powershell
# 进入项目目录
cd E:\Program\test01

# 直接运行服务器
node server.js
```

**注意**：这需要依赖包已正确安装

---

## ⚠️ 注意事项

### 1. 重启终端

安装或卸载 npm 后，必须重启 PowerShell 终端才能生效。

### 2. 管理员权限

某些操作可能需要管理员权限，可以右键点击 PowerShell 并选择"以管理员身份运行"。

### 3. 环境变量

确保 npm 已添加到 PATH 环境变量中。

---

## ✅ 验证清单

### npm 卸载和安装

- [ ] 全局 npm 目录已删除
- [ ] 最新 npm 已下载
- [ ] npm 已安装
- [ ] npm 版本已验证

### 项目依赖安装

- [ ] 项目依赖已安装
- [ ] 所有包已正确安装
- [ ] npm list 显示所有包

### 项目运行

- [ ] 服务器可以启动
- [ ] 可以访问 http://localhost:3000
- [ ] 所有功能正常工作

---

## 🎯 推荐方案

### 短期方案（立即可用）

**方案 1：手动删除并重新安装 npm**

1. 删除全局 npm 目录
2. 下载并安装最新 npm
3. 重新安装项目依赖
4. 运行项目

### 中期方案（备选）

**方案 2：迁移到 yarn**

1. 全局安装 yarn
2. 使用 yarn 安装依赖
3. 使用 yarn 运行项目

### 长期方案（推荐）

**方案 3：使用 pnpm 或 bun**

1. 全局安装 pnpm 或 bun
2. 使用 pnpm 或 bun 安装依赖
3. 使用 pnpm 或 bun 运行项目

---

## 🔗 相关资源

### 官方文档

- [npm 官网](https://npmjs.org/)
- [yarn 官网](https://yarnpkg.com/)
- [pnpm 官网](https://pnpm.io/)
- [bun 官网](https://bun.sh/)

### 项目文档

- [package.json](file:///e:\Program\test01\package.json)
- [server.js](file:///e:\Program\test01\server.js)
- [Node.js升级完成总结.md](file:///e:\Program\test01\.trae\documents\Node.js升级完成总结.md)

---

## 🎉 总结

### 问题根源

⚠️ **全局 npm 与 Node.js 20.x 不兼容**
- 位置：D:\Tools\node_modules\npm\
- 问题：fs-minipass 依赖包不兼容
- 影响：所有 npm 命令都失败

### 推荐解决方案

**方案 1：手动删除并重新安装 npm**（推荐）
1. 删除全局 npm 目录
2. 下载并安装最新 npm
3. 重新安装项目依赖
4. 运行项目

**方案 2：迁移到 yarn**（备选）
1. 全局安装 yarn
2. 使用 yarn 安装依赖
3. 使用 yarn 运行项目

### 下一步行动

1. **立即可用**：手动删除全局 npm 目录
2. **下载并安装**：最新版本的 npm
3. **重新安装依赖**：运行 npm install
4. **验证运行**：node server.js

---

**指南完成日期**: 2026-01-22  
**指南人员**: AI Assistant  
**项目状态**: Node.js 20.x 已安装，等待 npm 问题解决