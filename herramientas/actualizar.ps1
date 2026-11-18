# ============================================================================
#  CAPINOA - Aplicar una actualizacion
# ----------------------------------------------------------------------------
#  Toma el paquete de actualizacion (.zip) que mando Emiliano y reemplaza SOLO
#  la parte "programa" del sistema.
#
#  ┌──────────────────────────────────────────────────────────────────────┐
#  │  LA REGLA DE ORO: la carpeta pb_data NO SE TOCA NUNCA.               │
#  │  Ahi viven los pacientes, las historias clinicas, las fotos, los     │
#  │  turnos y las cuentas. Una actualizacion cambia las pantallas y el   │
#  │  motor, jamas los datos.                                            │
#  └──────────────────────────────────────────────────────────────────────┘
#
#  Lo que se reemplaza:
#    pb_public/      las pantallas
#    pb_migrations/  los cambios de estructura de la base
#    pocketbase.exe  el motor (solo si viene en el paquete)
#
#  Si una actualizacion agrega, por ejemplo, un campo nuevo a la ficha, eso
#  viene como "migracion": un archivo que le dice a la base "agregate esta
#  columna". Se aplica sobre los datos existentes SIN borrarlos.
# ============================================================================

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

<#
  Copia una carpeta completa con robocopy en vez de Copy-Item.

  ⚠️ No cambiar esto por Copy-Item. Windows corta las rutas a 260 caracteres, y
  las miniaturas de las fotos generan rutas larguísimas (sobre todo cuando la
  foto viene de WhatsApp, con nombres como
  "whats_app_image_2026_08_18_at_12_05_...jpeg"). Con Copy-Item el respaldo
  fallaba justo antes de actualizar. robocopy no tiene ese límite.

  robocopy devuelve 0-7 como "todo bien"; 8 o más es error de verdad.
#>
function Copiar-Carpeta($desde, $hacia) {
  $null = robocopy $desde $hacia /E /NFL /NDL /NJH /NJS /NC /NS /R:2 /W:1
  if ($LASTEXITCODE -ge 8) {
    throw "No se pudo copiar '$desde' (codigo $LASTEXITCODE)."
  }
  $global:LASTEXITCODE = 0
}

function Titulo($t) {
  Write-Host ""
  Write-Host "  ============================================" -ForegroundColor Cyan
  Write-Host "    $t" -ForegroundColor Cyan
  Write-Host "  ============================================" -ForegroundColor Cyan
  Write-Host ""
}
function Fallar($m) {
  Write-Host ""
  Write-Host "  $m" -ForegroundColor Red
  Write-Host ""
  Read-Host "  Enter para cerrar"
  exit 1
}

Titulo "CAPINOA - Actualizar el sistema"

# ---- 1. El sistema tiene que estar apagado ----
$encendido = (Test-NetConnection -ComputerName 127.0.0.1 -Port 8090 -InformationLevel Quiet -WarningAction SilentlyContinue)
if ($encendido) {
  Fallar @"
El sistema esta ENCENDIDO y hay que apagarlo para actualizar.

  1. Cerra la ventana negra de CAPINOA.
  2. Volve a hacer doble clic en actualizar-capinoa.bat.
"@
}

# ---- 2. Buscar el paquete ----
New-Item -ItemType Directory -Force -Path "actualizaciones" | Out-Null
$paquete = Get-ChildItem "actualizaciones\*.zip" -File -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $paquete) {
  Fallar @"
No encontre ninguna actualizacion.

  Guarda el archivo .zip que te mando Emiliano dentro de la carpeta:
    $raiz\actualizaciones

  y volve a hacer doble clic en actualizar-capinoa.bat.
"@
}

Write-Host "  Actualizacion encontrada:" -ForegroundColor Green
Write-Host "    $($paquete.Name)"
Write-Host "    ($([math]::Round($paquete.Length/1KB)) KB, del $($paquete.LastWriteTime.ToString('dd/MM/yyyy')))"
Write-Host ""

# ---- 3. Copia de seguridad ANTES de tocar nada ----
Write-Host "  Paso 1 de 4: copia de seguridad de tus datos..."
$sello = Get-Date -Format "yyyy-MM-dd_HHmm"
$respaldo = "respaldos\pb_data_antes_de_actualizar_$sello"
New-Item -ItemType Directory -Force -Path "respaldos" | Out-Null
if (Test-Path "pb_data") {
  Copiar-Carpeta "pb_data" $respaldo
  Write-Host "    Guardada en $respaldo" -ForegroundColor Green
} else {
  Write-Host "    (todavia no hay datos que respaldar)" -ForegroundColor Yellow
}

# ---- 4. Descomprimir en un lugar aparte ----
Write-Host "  Paso 2 de 4: abriendo el paquete..."
$temporal = Join-Path $env:TEMP "capinoa_actualizacion_$sello"
if (Test-Path $temporal) { Remove-Item -Recurse -Force $temporal }
try {
  Expand-Archive -Path $paquete.FullName -DestinationPath $temporal -Force
} catch {
  Fallar "No pude abrir el archivo .zip. Puede que se haya bajado a medias: pedile a Emiliano que te lo mande de nuevo."
}

# El .zip puede traer todo suelto o dentro de una carpeta: buscamos donde esta.
$origen = $temporal
if (-not (Test-Path (Join-Path $origen "pb_public"))) {
  $adentro = Get-ChildItem $temporal -Directory | Select-Object -First 1
  if ($adentro -and (Test-Path (Join-Path $adentro.FullName "pb_public"))) {
    $origen = $adentro.FullName
  }
}
if (-not (Test-Path (Join-Path $origen "pb_public"))) {
  Fallar "El paquete no tiene la forma esperada (le falta la carpeta pb_public). Avisale a Emiliano."
}

# ---- 5. Reemplazar SOLO el programa ----
Write-Host "  Paso 3 de 4: reemplazando las pantallas..."

if (Test-Path "pb_public") { Remove-Item -Recurse -Force "pb_public" }
Copy-Item -Recurse -Force (Join-Path $origen "pb_public") "pb_public"

if (Test-Path (Join-Path $origen "pb_migrations")) {
  New-Item -ItemType Directory -Force -Path "pb_migrations" | Out-Null
  Copy-Item -Force (Join-Path $origen "pb_migrations\*.js") "pb_migrations\"
}

if (Test-Path (Join-Path $origen "pb_hooks")) {
  New-Item -ItemType Directory -Force -Path "pb_hooks" | Out-Null
  Copy-Item -Force (Join-Path $origen "pb_hooks\*.js") "pb_hooks\"
}

if (Test-Path (Join-Path $origen "pocketbase.exe")) {
  Copy-Item -Force (Join-Path $origen "pocketbase.exe") "pocketbase.exe"
}

# Los .bat y el manual, si vienen actualizados.
foreach ($suelto in @("iniciar-capinoa.bat", "actualizar-capinoa.bat", "respaldar.bat", "README.md")) {
  $ruta = Join-Path $origen $suelto
  if (Test-Path $ruta) { Copy-Item -Force $ruta $suelto }
}
if (Test-Path (Join-Path $origen "herramientas")) {
  New-Item -ItemType Directory -Force -Path "herramientas" | Out-Null
  Copy-Item -Force (Join-Path $origen "herramientas\*.ps1") "herramientas\"
}

# ---- 6. Actualizar la estructura de la base (sin tocar los datos) ----
Write-Host "  Paso 4 de 4: actualizando la base de datos..."
$salida = & ".\pocketbase.exe" migrate up 2>&1
$codigo = $LASTEXITCODE

# PocketBase escupe cada consulta SQL que ejecuta. Para Ricardo eso es ruido
# incomprensible: mostramos solo lo que le sirve (qué se aplicó y los errores).
$limpio = $salida | Where-Object { $_ -notmatch '^\s*\[\d' -and $_ -notmatch '^\s*$' }
if ($limpio) {
  $limpio | ForEach-Object { Write-Host "    $_" }
} else {
  Write-Host "    (no habia cambios pendientes en la base)"
}

if ($codigo -ne 0) {
  Write-Host ""
  Write-Host "  Hubo un problema al actualizar la base." -ForegroundColor Red
  Write-Host "  Tus datos NO se tocaron y ademas quedo la copia en:" -ForegroundColor Yellow
  Write-Host "    $respaldo"
  Write-Host "  Sacale una foto a esta pantalla y mandasela a Emiliano."
  Read-Host "`n  Enter para cerrar"
  exit 1
}

# ---- 7. Archivar el paquete aplicado ----
New-Item -ItemType Directory -Force -Path "actualizaciones\aplicadas" | Out-Null
Move-Item -Force $paquete.FullName (Join-Path "actualizaciones\aplicadas" $paquete.Name)
Remove-Item -Recurse -Force $temporal -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  LISTO. El sistema quedo actualizado." -ForegroundColor Green
Write-Host "  Tus pacientes, historias, fotos, turnos y cuentas estan intactos."
Write-Host ""
Write-Host "  Ya podes abrir CAPINOA con iniciar-capinoa.bat"
Write-Host ""
Read-Host "  Enter para cerrar"
