# Vercel 部署错误排查指南

## 错误信息
```
deploy Process completed with exit code 128
```

## 可能的原因

### 1. Git 认证问题
- Vercel 无法访问 GitHub 仓库
- 需要重新授权 Vercel 访问 GitHub

### 2. 仓库访问权限
- Vercel 项目没有正确的 GitHub 仓库访问权限
- 需要在 Vercel Dashboard 中重新连接仓库

### 3. 环境变量配置
- 缺少必要的环境变量（SUPABASE_URL, SUPABASE_KEY, JWT_SECRET）
- 需要在 Vercel 项目设置中添加环境变量

## 解决步骤

### 步骤 1: 检查 Vercel 项目设置

1. 访问 https://vercel.com/dashboard
2. 选择你的项目 `timeline-app-one`
3. 进入 **Settings** > **Git**
4. 检查 GitHub 仓库连接状态
5. 如果显示断开，点击 **Reconnect** 重新连接

### 步骤 2: 检查环境变量

1. 在 Vercel 项目中进入 **Settings** > **Environment Variables**
2. 确保以下环境变量已配置：
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `JWT_SECRET`
3. 如果缺少，点击 **Add New** 添加
4. 确保选择正确的环境（Production, Preview, Development）

### 步骤 3: 手动触发部署

1. 在 Vercel 项目中进入 **Deployments**
2. 点击右上角的 **Redeploy** 按钮
3. 选择最新的 commit（45cc65e）
4. 点击 **Redeploy** 开始部署

### 步骤 4: 查看部署日志

1. 在 Vercel 项目中进入 **Deployments**
2. 点击最新的部署记录
3. 查看 **Build Logs** 和 **Function Logs**
4. 查找具体的错误信息

## 当前 Git 状态

### 已推送的提交
- ✅ 45cc65e - 更新测试脚本默认邮箱为 california_finch@outlook.com
- ✅ 9c6dc08 - 添加 Email Auth 测试脚本
- ✅ bbfb6ae - 完成邮箱验证码功能集成
- ✅ 0ce3c8e - 添加Supabase Email Auth启用指南

### 分支状态
- 当前分支：main
- 与 origin/main 同步：是
- 所有提交已推送到 GitHub

## 验证部署成功

部署成功后，你应该能够：

1. 访问前端：https://californiafinch.github.io
2. 访问后端 API：https://timeline-app-one.vercel.app/api
3. 测试注册功能：
   - 打开注册页面
   - 输入邮箱并点击"发送验证码"
   - 输入验证码并完成注册

## 常见问题

### Q: Git 推送成功但 Vercel 部署失败？
A: 这是正常的。Git 推送和 Vercel 部署是两个独立的步骤。Git 推送成功后，Vercel 会自动检测到新的提交并开始部署。

### Q: 如何查看 Vercel 部署状态？
A: 访问 https://vercel.com/dashboard，选择你的项目，进入 **Deployments** 页面查看部署状态和日志。

### Q: 部署需要多长时间？
A: 通常需要 1-2 分钟完成部署。如果超过 5 分钟，可能存在问题。

### Q: 如何手动触发部署？
A: 在 Vercel Dashboard 中进入 **Deployments**，点击右上角的 **Redeploy** 按钮。

## 联系支持

如果以上步骤都无法解决问题：
1. 查看 Vercel 官方文档：https://vercel.com/docs
2. 联系 Vercel 支持：https://vercel.com/support
3. 查看 Vercel 状态页面：https://vercel-status.com

## 备注

- Git 推送是成功的（exit code 0）
- 代码已经推送到 GitHub：https://github.com/californiafinch/timeline-app.git
- 问题是 Vercel 部署，不是 Git 推送
- 需要在 Vercel Dashboard 中排查部署问题