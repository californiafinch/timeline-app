@echo off

REM 触发 Vercel 重新部署的批处理文件
REM 使用空提交触发 GitHub Actions 和 Vercel 部署

echo 开始触发 Vercel 重新部署...
echo.

REM 检查是否在 git 仓库中
if not exist ".git" (
    echo 错误: 当前目录不是 git 仓库
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 创建空提交
echo 创建空提交...
git commit --allow-empty -m "触发 Vercel 重新部署"

if %errorlevel% neq 0 (
    echo 错误: 创建空提交失败
    pause
    exit /b 1
)

REM 推送到 GitHub
echo 推送到 GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo 错误: 推送失败
    echo 请检查网络连接和 GitHub 权限
    pause
    exit /b 1
)

echo.
echo 部署触发成功！
echo Vercel 将自动开始部署最新更改

echo.
echo 请按照以下步骤验证部署状态：
echo 1. 访问 Vercel 项目页面：https://vercel.com/californiafinch/timeline-app
echo 2. 检查 Deployments 标签页，确认最新部署状态为 "Ready"
echo 3. 访问项目 URL 验证部署是否成功

echo.
echo 完成！
pause