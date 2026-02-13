$ErrorActionPreference = 'Stop'

$backendPort = 3000
$frontendPort = 4200

function Stop-PortProcess([int]$port) {
  $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  if ($pids) {
    foreach ($procId in $pids) {
      Stop-Process -Id $procId -Force
    }
  }
}

Write-Host "[dev-start] Limpando portas $backendPort e $frontendPort..." -ForegroundColor Cyan
Stop-PortProcess -port $backendPort
Stop-PortProcess -port $frontendPort

Write-Host '[dev-start] Iniciando backend...' -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
  Set-Location 'c:\BitBot\bit-foot\backend'
  npm run start:dev
}

Start-Sleep -Seconds 2

Write-Host '[dev-start] Iniciando frontend...' -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
  Set-Location 'c:\BitBot\bit-foot\frontend'
  npm run start -- --host 127.0.0.1 --port 4200
}

Write-Host "[dev-start] Backend job: $($backendJob.Id) | Frontend job: $($frontendJob.Id)" -ForegroundColor Green
Write-Host '[dev-start] URLs: http://localhost:3000/api/health e http://127.0.0.1:4200' -ForegroundColor Green
