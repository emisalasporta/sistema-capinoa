#!/bin/bash
# ===========================================================================
#  CAPINOA - subir cambios y publicarlos
# ---------------------------------------------------------------------------
#  Doble clic aca para mandar a internet los cambios que estan en esta
#  carpeta. Hace todo solo:
#    1. Revisa que las pantallas no tengan errores.
#    2. Guarda los cambios y los sube a GitHub.
#    3. Espera a que el servidor los publique y avisa cuando ya estan
#       funcionando (2 a 4 minutos).
#
#  Los datos de la clinica NO se tocan: una actualizacion cambia las
#  pantallas y el motor, nunca los pacientes ni las fotos.
# ===========================================================================
source "$(dirname "$0")/herramientas/comun.sh"
cd "$RAIZ" || exit 1
titulo "subir cambios"

CUENTA="emisalasporta"
URL="${CAPINOA_URL:-$(clave_de CAPINOA_URL)}"; URL="${URL%/}"
[ -n "$URL" ] || URL="https://capinoa.emilianosalasporta.cloud"

[ "$(git branch --show-current)" = "main" ] || fallo "Esta carpeta no esta en la rama principal (main)."
LLAVE=$(gh auth token --user "$CUENTA" 2>/dev/null)
[ -n "$LLAVE" ] || fallo "No encuentro la sesion de GitHub de $CUENTA en esta Mac."

# Ultima defensa: el repositorio es publico. Si algo sensible quedara listo
# para subir (no deberia: esta todo en .gitignore), se frena aca.
git add -A
PELIGRO=$(git diff --cached --name-only | grep -E -i '(^|/)(pb_data|respaldos|paquetes|entrega|actualizaciones)/|claves|\.env$|\.zip$|\.rar$|\.db$' )
if [ -n "$PELIGRO" ]; then
  git reset -q
  echo "$PELIGRO" | sed 's/^/    /'
  fallo "Estos archivos NO pueden subirse a un repositorio publico." "No se subio nada."
fi

CAMBIOS=$(git diff --cached --name-only | grep -v '^web/public/version.txt$')
PENDIENTES=$(git log origin/main..main --format='%s' 2>/dev/null)

if [ -z "$CAMBIOS" ] && [ -z "$PENDIENTES" ]; then
  git reset -q
  echo "  No hay cambios para subir. Esta todo al dia."
  cerrar 0
fi

echo "  Revisando que las pantallas no tengan errores..."
REVISION=$(mktemp)
if ! ( cd web && npm run check >"$REVISION" 2>&1 ); then
  git reset -q
  tail -25 "$REVISION"
  fallo "Las pantallas tienen errores: no se subio nada."
fi
echo "  Sin errores."
echo

# Sello de esta publicacion: sirve para saber cuando el servidor ya la tiene.
SELLO="$(date '+%Y-%m-%d %H:%M:%S')"
echo "$SELLO" > web/public/version.txt
git add -A

if [ -n "$CAMBIOS" ]; then
  echo "  Archivos que cambiaron:"
  echo "$CAMBIOS" | head -15 | sed 's/^/    - /'
  [ "$(echo "$CAMBIOS" | wc -l)" -gt 15 ] && echo "    ... y mas"
  echo
  read -r -p "  En pocas palabras, que cambia? (Enter = sin descripcion) " QUE
fi
[ -n "$QUE" ] || QUE="Actualizacion del $(date '+%d/%m/%Y %H:%M')"
git commit -q -m "$QUE" || fallo "No se pudieron guardar los cambios."

if [ -n "$PENDIENTES" ]; then
  echo "  Tambien se sube lo que ya estaba preparado:"
  echo "$PENDIENTES" | sed 's/^/    - /'
fi
echo
echo "  Subiendo..."
if ! git -c credential.helper= \
     -c "credential.helper=!f() { test \"\$1\" = get || exit 0; echo username=$CUENTA; echo \"password=\$(gh auth token --user $CUENTA)\"; }; f" \
     push -q origin main; then
  fallo "No se pudo subir."
fi
echo "  Subido. Ahora el servidor lo publica solo; espero a que termine..."

for i in $(seq 1 48); do
  sleep 10
  if [ "$(curl -s --max-time 10 "$URL/version.txt" | tr -d '\r\n')" = "$SELLO" ]; then
    echo
    echo "  LISTO: los cambios ya estan publicados en"
    echo "    $URL"
    echo "  (quien tenga el sistema abierto solo tiene que recargar la pagina)"
    cerrar 0
  fi
  printf '.'
done

echo
echo
echo "  Los cambios se SUBIERON, pero despues de 8 minutos el servidor"
echo "  todavia no los muestra. Puede estar tardando o haber fallado."
echo "  Abri Dokploy (aplicacion CAPINOA, pestana Deployments) y fijate;"
echo "  si no arranco solo, apreta Deploy."
cerrar 1
