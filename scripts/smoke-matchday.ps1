$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api'

Write-Host '[smoke] health...' -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$base/health" -Method Get
if ($health.status -ne 'ok') { throw 'Health inválido.' }

Write-Host '[smoke] criando save...' -ForegroundColor Cyan
$club = (Invoke-RestMethod -Uri "$base/clubs?page=1&limit=1" -Method Get).data[0]
$save = Invoke-RestMethod -Uri "$base/save-games" -Method Post -ContentType 'application/json' -Body (@{name="Smoke MatchDay $(Get-Date -Format HHmmss)"; clubId=$club.id}|ConvertTo-Json)

Write-Host '[smoke] setup competições...' -ForegroundColor Cyan
$setup = Invoke-RestMethod -Uri ("$base/competitions/save/{0}/setup" -f $save.id) -Method Post
$seasonId = ($setup | Select-Object -First 1).seasonId
if (-not $seasonId) { throw 'seasonId não retornado no setup.' }

Write-Host '[smoke] pegando fixture...' -ForegroundColor Cyan
$fixtures = Invoke-RestMethod -Uri ("$base/competitions/seasons/{0}/fixtures?round=1" -f $seasonId) -Method Get
$fixtureId = ($fixtures.data | Select-Object -First 1).id
if (-not $fixtureId) { throw 'Nenhum fixture encontrado na rodada 1.' }

Write-Host '[smoke] abrindo match-day (join path)...' -ForegroundColor Cyan
$fixture = Invoke-RestMethod -Uri ("$base/competitions/fixtures/{0}" -f $fixtureId) -Method Get

Write-Host '[smoke] simulando rodada para gerar dados da partida...' -ForegroundColor Cyan
Invoke-RestMethod -Uri ("$base/competitions/seasons/{0}/simulate-round?round=1" -f $seasonId) -Method Post | Out-Null

Write-Host '[smoke] consultando detalhes da partida...' -ForegroundColor Cyan
$detail = Invoke-RestMethod -Uri ("$base/matches/fixtures/{0}" -f $fixtureId) -Method Get

if (-not $detail.match) { throw 'Detalhes da partida não retornados.' }

Write-Host "[smoke] OK fixture=$fixtureId score=$($detail.match.homeScore)x$($detail.match.awayScore) status=$($fixture.status)" -ForegroundColor Green
