@echo off
echo ============================================================
echo 运行历史年表项目
echo ============================================================
echo.

REM 直接运行服务器，不需要 cd 命令
node server.js

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo 服务器启动成功！
    echo ============================================================
    echo.
    echo 服务器运行在: http://localhost:3000
    echo.
    echo 按 Ctrl+C 停止服务器
    echo.
) else (
    echo.
    echo ============================================================
    echo 服务器启动失败
    echo ============================================================
    echo.
    echo 错误代码: %errorlevel%
    echo.
    echo 可能的原因:
    echo 1. node_modules 不存在，依赖包未安装
    echo 2. npm 与 Node.js 20.x 不兼容
    echo 3. 环境变量未正确设置
    echo.
    echo 解决方案:
    echo 方案 1: 使用 CMD 运行 node server.js（当前方案）
    echo 方案 2: 修复 npm 问题后重新安装依赖
    echo.
)

pause