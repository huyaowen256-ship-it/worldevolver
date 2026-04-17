# WorldEvolver 一键启动脚本
# 用法: 右键 -> 用 PowerShell 运行
# 或者: powershell -ExecutionPolicy Bypass -File start.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ProjectRoot) { $ProjectRoot = $PSScriptRoot }

function Start-InNewWindow {
    param($Title, $WorkingDir, $Command)
    Start-Process cmd -ArgumentList "/k title $Title && cd /d `"$WorkingDir`" && $Command"
}

Write-Host ""
Write-Host "  ==============================" -ForegroundColor Cyan
Write-Host "  WorldEvolver 一键启动" -ForegroundColor Cyan
Write-Host "  ==============================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
try {
    $v = & node --version 2>&1
    Write-Host "  [OK] Node.js $v" -ForegroundColor Green
} catch {
    Write-Host "  [错误] 未找到 Node.js，请先安装 https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 检查并安装依赖
$deps = @{
    "backend" = (Join-Path $ProjectRoot "backend\node_modules");
    "web"     = (Join-Path $ProjectRoot "web\node_modules");
}
foreach ($name in @("backend","web")) {
    if (-not (Test-Path $deps[$name])) {
        Write-Host "  [安装] $name 依赖..." -ForegroundColor Yellow
        & npm install --prefix (Split-Path $deps[$name]) *> $null
    }
}

Write-Host ""
Write-Host "  [启动] 后端 (localhost:3001)..." -ForegroundColor Cyan
Start-InNewWindow -Title "WorldEvolver-Backend" `
    -WorkingDir (Join-Path $ProjectRoot "backend") `
    -Command "node server.js"

Start-Sleep -Seconds 3

Write-Host "  [启动] 前端 (localhost:3000)..." -ForegroundColor Cyan
Start-InNewWindow -Title "WorldEvolver-Web" `
    -WorkingDir (Join-Path $ProjectRoot "web") `
    -Command "npm run dev"

Start-Sleep -Seconds 4

Write-Host "  [打开] 浏览器..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "  后端: http://localhost:3001" -ForegroundColor White
Write-Host "  前端: http://localhost:3000" -ForegroundColor White
Write-Host "  关闭子窗口即可停止服务" -ForegroundColor Gray
Write-Host ""
