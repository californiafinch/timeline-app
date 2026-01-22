@echo off
chcp 65001 >nul
cd /d "e:\Program\test01"
echo 正在启动开发服务器（nodemon 自动重启）...
pnpm run dev
pause