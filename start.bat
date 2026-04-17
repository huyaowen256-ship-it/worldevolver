@echo off
chcp 65001 >nul
title WorldEvolver 一键启动

echo ========================================
echo   WorldEvolver 一键启动
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 https://nodejs.org/
    pause
    exit /b 1
)

:: 启动后端（新窗口）
echo [1/3] 启动后端服务...
start "WorldEvolver-Backend" cmd /k "cd /d "%~dp0backend" ^&^& node server.js"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端（新窗口）
echo [2/3] 启动前端服务...
start "WorldEvolver-Web" cmd /k "cd /d "%~dp0web" ^&^& npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

:: 自动打开浏览器
echo [3/3] 打开浏览器...
start http://localhost:3000

echo.
echo ========================================
echo   已启动完成！
echo   后端: http://localhost:3001
echo   前端: http://localhost:3000
echo ========================================
echo.
echo   关闭窗口即可停止所有服务
pause
