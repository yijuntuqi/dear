@echo off
chcp 65001 >nul
title Dear 项目一键启动

echo ========================================
echo   💝 Dear 项目一键启动脚本
echo ========================================
echo.

:: 获取当前脚本所在目录
set "PROJECT_ROOT=%~dp0"

:: 检查后端目录
if not exist "%PROJECT_ROOT%server" (
    echo ❌ 错误：找不到 server 目录
    pause
    exit /b 1
)

:: 检查前端目录
if not exist "%PROJECT_ROOT%client" (
    echo ❌ 错误：找不到 client 目录
    pause
    exit /b 1
)

echo 📦 正在启动后端服务器...
start "Dear Backend" cmd /k "cd /d "%PROJECT_ROOT%server" && echo 💝 启动后端... && node index.js"

:: 等待3秒，让后端先启动
timeout /t 3 /nobreak >nul

echo 📦 正在启动前端开发服务器...
start "Dear Frontend" cmd /k "cd /d "%PROJECT_ROOT%client" && echo 🎨 启动前端... && npm run dev"

echo.
echo ========================================
echo   ✅ 启动完成！
echo.
echo   后端地址：http://localhost:3001
echo   前端地址：http://localhost:5173
echo.
echo   关闭对应窗口即可停止服务
echo ========================================
echo.

:: 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:5173

pause