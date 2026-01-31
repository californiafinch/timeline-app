# Vercel部署指南

## 问题描述
Vercel上的Production Deployment没有部署最近几次的更改，需要确保Vercel部署最新的更改，与GitHub Actions一致。

## 解决方法

### 方法1：通过Vercel网页界面手动触发部署

1. **登录Vercel账户**
   - 访问 https://vercel.com
   - 使用GitHub账户登录

2. **找到项目**
   - 在Dashboard中找到 `timeline-app` 项目

3. **触发重新部署**
   - 点击项目进入详情页
   - 点击顶部的 "Deployments" 标签
   - 点击 "Deploy" 按钮
   - 选择 "Production" 环境
   - 点击 "Deploy" 按钮触发部署

### 方法2：通过GitHub仓库触发Vercel部署

1. **访问GitHub仓库**
   - 访问 https://github.com/californiafinch/timeline-app

2. **检查Vercel集成**
   - 点击 "Settings" 标签
   - 点击 "Integrations" 左侧菜单
   - 确认Vercel集成已启用

3. **推送一个空提交触发部署**
   - 在本地终端运行以下命令：
     ```bash
     git commit --allow-empty -m "触发Vercel重新部署"
     git push origin main
     ```
   - 这将创建一个空提交并推送到GitHub，触发Vercel的自动部署

### 方法3：检查Vercel部署配置

1. **检查vercel.json文件**
   - 确保vercel.json文件配置正确
   - 检查构建规则和路由规则是否覆盖了所有必要的文件

2. **检查GitHub Actions配置**
   - 确保GitHub Actions的deploy.yml文件配置正确
   - 确认部署到GitHub Pages的流程正常运行

## 验证部署状态

1. **检查Vercel部署状态**
   - 访问Vercel项目的Deployments页面
   - 确认最新的部署状态为 "Ready"
   - 记录部署的URL

2. **检查GitHub Pages状态**
   - 访问GitHub仓库的 "Settings" → "Pages" 页面
   - 确认部署状态为 "Deployed"
   - 记录GitHub Pages的URL

3. **测试访问**
   - 访问GitHub Pages的URL（https://californiafinch.github.io/timeline-app）
   - 确认页面正常加载
   - 测试API功能是否正常

## 常见问题排查

1. **Vercel部署失败**
   - 检查部署日志，查看错误信息
   - 确保所有依赖项都已正确安装
   - 确保构建命令执行成功

2. **GitHub Pages访问失败**
   - 检查GitHub Actions的部署日志
   - 确认部署分支设置正确
   - 等待一段时间，GitHub Pages部署可能需要几分钟时间

3. **API端点无法访问**
   - 检查Vercel的路由配置
   - 确认API文件的路径和命名正确
   - 测试本地API功能是否正常

## 联系支持

如果遇到无法解决的问题，可以：
1. 联系Vercel支持团队
2. 检查Vercel的文档：https://vercel.com/docs
3. 检查GitHub Pages的文档：https://docs.github.com/en/pages