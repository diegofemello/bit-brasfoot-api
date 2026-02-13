$ErrorActionPreference = 'SilentlyContinue'

$ports = @(3000, 4200)

foreach ($port in $ports) {
  $pids = Get-NetTCPConnection -LocalPort $port -State Listen |
    Select-Object -ExpandProperty OwningProcess -Unique

  if ($pids) {
    foreach ($procId in $pids) {
      Stop-Process -Id $procId -Force
      Write-Host "[dev-stop] Processo $procId encerrado na porta $port" -ForegroundColor Yellow
    }
  }
}

$jobs = Get-Job | Where-Object { $_.State -in @('Running', 'NotStarted') }
if ($jobs) {
  $jobs | Stop-Job -Force
  $jobs | Remove-Job -Force
  Write-Host '[dev-stop] Jobs de desenvolvimento encerrados.' -ForegroundColor Yellow
}

Write-Host '[dev-stop] Ambiente local finalizado.' -ForegroundColor Green
