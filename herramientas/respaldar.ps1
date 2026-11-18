# ============================================================================
#  CAPINOA - Copia de seguridad
# ----------------------------------------------------------------------------
#  Copia la carpeta pb_data (base de datos + fotos + historias) a la carpeta
#  "respaldos", con la fecha en el nombre.
#
#  Se puede correr con el sistema encendido: PocketBase usa SQLite y la copia
#  puede quedar a mitad de una escritura. Por las dudas avisamos y sugerimos
#  apagarlo, que es la forma 100% segura.
# ============================================================================

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

<#
  Se copia con robocopy y no con Copy-Item: las miniaturas de las fotos generan
  rutas que pasan el límite de 260 caracteres de Windows, y Copy-Item se planta
  a mitad de camino. robocopy no tiene ese problema.
#>
function Copiar-Carpeta($desde, $hacia) {
  $null = robocopy $desde $hacia /E /NFL /NDL /NJH /NJS /NC /NS /R:2 /W:1
  if ($LASTEXITCODE -ge 8) { throw "No se pudo copiar '$desde' (codigo $LASTEXITCODE)." }
  $global:LASTEXITCODE = 0
}

function Titulo($t) {
  Write-Host ""
  Write-Host "  ============================================" -ForegroundColor Cyan
  Write-Host "    $t" -ForegroundColor Cyan
  Write-Host "  ============================================" -ForegroundColor Cyan
  Write-Host ""
}

Titulo "CAPINOA - Copia de seguridad"

if (-not (Test-Path "pb_data")) {
  Write-Host "  No encuentro la carpeta pb_data." -ForegroundColor Red
  Write-Host "  Este archivo tiene que estar dentro de la carpeta de CAPINOA."
  Read-Host "`n  Enter para cerrar"
  exit 1
}

# ¿Está encendido? Avisamos, pero dejamos seguir.
$encendido = (Test-NetConnection -ComputerName 127.0.0.1 -Port 8090 -InformationLevel Quiet -WarningAction SilentlyContinue)
if ($encendido) {
  Write-Host "  ATENCION: el sistema esta encendido." -ForegroundColor Yellow
  Write-Host "  La copia va a funcionar igual, pero lo mas seguro es cerrar"
  Write-Host "  primero la ventana negra de CAPINOA y volver a correr esto."
  Write-Host ""
  $seguir = Read-Host "  Copiar igual? (S/N)"
  if ($seguir -notmatch '^[sSyY]') { exit 0 }
  Write-Host ""
}

$sello = Get-Date -Format "yyyy-MM-dd_HHmm"
$destino = Join-Path $raiz "respaldos\pb_data_$sello"

Write-Host "  Copiando... (puede tardar si hay muchas fotos)"
New-Item -ItemType Directory -Force -Path (Join-Path $raiz "respaldos") | Out-Null
Copiar-Carpeta "pb_data" $destino

$tam = (Get-ChildItem $destino -Recurse -File | Measure-Object -Property Length -Sum).Sum
$mb = [math]::Round($tam / 1MB, 1)

Write-Host ""
Write-Host "  LISTO. Copia guardada en:" -ForegroundColor Green
Write-Host "    $destino"
Write-Host "    ($mb MB)"
Write-Host ""
Write-Host "  IMPORTANTE: esta copia esta en la MISMA computadora." -ForegroundColor Yellow
Write-Host "  Copiala tambien a un pendrive o a la nube. Si se rompe la"
Write-Host "  notebook, esta copia se pierde junto con el original."
Write-Host ""

# Dejamos abierta la carpeta para que sea facil arrastrarla al pendrive.
Start-Process explorer.exe (Join-Path $raiz "respaldos")

Read-Host "  Enter para cerrar"
