$ErrorActionPreference = "Stop"

Write-Host "开始下载 pnpm..." -ForegroundColor Green

$pnpmUrl = "https://github.com/pnpm/pnpm/releases/download/v8.15.6/pnpm-win-x64.exe"
$pnpmPath = "$env:LOCALAPPDATA\pnpm\pnpm.exe"

$pnpmDir = Split-Path $pnpmPath -Parent
if (!(Test-Path $pnpmDir)) {
    New-Item -ItemType Directory -Path $pnpmDir -Force | Out-Null
}

Write-Host "正在从 $pnpmUrl 下载..." -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $pnpmUrl -OutFile $pnpmPath -UseBasicParsing
    Write-Host "✓ pnpm 下载成功到 $pnpmPath" -ForegroundColor Green
} catch {
    Write-Host "✗ 下载失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "正在验证 pnpm..." -ForegroundColor Yellow
try {
    & $pnpmPath --version
    Write-Host "✓ pnpm 安装成功！" -ForegroundColor Green
} catch {
    Write-Host "✗ pnpm 验证失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "请将 $pnpmDir 添加到系统 PATH 环境变量中" -ForegroundColor Cyan