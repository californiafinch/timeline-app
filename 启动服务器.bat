@echo off
cd /d "e:\Program\test01"
echo.
echo ========================================
echo   历史年表网站 - 服务器启动
echo ========================================
echo.
echo 正在启动服务器...
echo.
node server.js
echo.
echo ========================================
echo   服务器已启动！
echo   访问地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.
pause