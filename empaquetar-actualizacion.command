#!/bin/bash
# ===========================================================================
#  CAPINOA - Armar un paquete de actualizacion   (version para Mac)
#  Doble clic aca. Esto lo corre EMILIANO, no Ricardo.
# ===========================================================================
#  Compila el sistema y deja un .zip en la carpeta "paquetes" listo para
#  mandarle a Ricardo. El .zip NUNCA lleva la base de datos: los datos de
#  Ricardo son de Ricardo y se quedan en su computadora.
#
#  Ricardo usa Windows, asi que el paquete lleva los .bat de Windows.
#  Eso es a proposito y esta bien.
#
#  Equivalente de empaquetar-actualizacion.bat + herramientas/empaquetar.ps1
# ===========================================================================

set -e
cd "$(dirname "$0")" || exit 1
printf '\033]0;CAPINOA - armar actualizacion\007'

fallo() {
  echo
  echo "  *** Hubo un error. Revisa el mensaje de arriba. ***"
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
}
trap fallo ERR

echo
echo "  ============================================"
echo "    CAPINOA - Armar actualizacion"
echo "  ============================================"
echo

echo "  Paso 1 de 3: compilando las pantallas..."
cd web
npm install --no-audit --no-fund --silent
npm run check
npm run build
cd ..

echo "  Paso 2 de 3: juntando los archivos..."
SELLO=$(date +%Y-%m-%d)
NOMBRE="capinoa-actualizacion-$SELLO"
TEMPORAL="/tmp/$NOMBRE"
rm -rf "$TEMPORAL"
mkdir -p "$TEMPORAL"

cp -R web/dist      "$TEMPORAL/pb_public"
cp -R pb_migrations "$TEMPORAL/pb_migrations"
cp -R pb_hooks      "$TEMPORAL/pb_hooks"
cp -R herramientas  "$TEMPORAL/herramientas"
for f in iniciar-capinoa.bat actualizar-capinoa.bat respaldar.bat README.md; do
  [ -f "$f" ] && cp -f "$f" "$TEMPORAL/$f"
done

# Verificacion de seguridad: que NO se cuele pb_data.
if [ -d "$TEMPORAL/pb_data" ]; then
  rm -rf "$TEMPORAL/pb_data"
  echo "  (se quito pb_data del paquete)"
fi

echo "  Paso 3 de 3: comprimiendo..."
mkdir -p paquetes
ZIP="$(pwd)/paquetes/$NOMBRE.zip"
rm -f "$ZIP"
( cd "$TEMPORAL" && zip -r -q "$ZIP" . -x ".DS_Store" )
rm -rf "$TEMPORAL"

TAM=$(du -h "$ZIP" | cut -f1)

trap - ERR
echo
echo "  LISTO. Paquete armado:"
echo "    $ZIP  ($TAM)"
echo
echo "  Mandaselo a Ricardo y decile que:"
echo "    1. Cierre CAPINOA (la ventana negra)."
echo "    2. Guarde el .zip en la carpeta 'actualizaciones'."
echo "    3. Haga doble clic en actualizar-capinoa.bat."
echo
open paquetes
read -r -p "  Enter para cerrar" _
exit 0
