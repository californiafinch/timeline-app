# 启动时间轴应用服务器
Write-Host "正在启动时间轴应用服务器..." -ForegroundColor Cyan
$process = Start-Process -FilePath "node" -ArgumentList "server.js" -NoNewWindow -PassThru
Write-Host "服务器已启动，进程ID: $($process.Id)" -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
$process.WaitForExit()
