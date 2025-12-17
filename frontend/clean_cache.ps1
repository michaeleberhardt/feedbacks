Stop-Process -Name "node" -ErrorAction SilentlyContinue
Write-Host "Stopping Node processes..."
Start-Sleep -Seconds 2

$CachePath = "$PSScriptRoot\node_modules\.vite"
if (Test-Path $CachePath) {
    Write-Host "Removing Vite cache at $CachePath..."
    Remove-Item -Recurse -Force $CachePath
    Write-Host "Cache cleared."
}
else {
    Write-Host "No cache found at $CachePath"
}

Write-Host "You can now run 'npm run dev' or '.\start_dev.ps1' again."
