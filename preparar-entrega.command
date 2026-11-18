#!/bin/bash
# ===========================================================================
#  CAPINOA - Preparar la carpeta para entregarle a Ricardo  (version para Mac)
#  Doble clic aca. Esto lo corre EMILIANO.
# ===========================================================================
#  Deja en "entrega/CAPINOA" el sistema completo y limpio, listo para copiar
#  a un pendrive: base de datos nueva, usuarios creados, sin datos de prueba.
#
#  IMPORTANTE: Ricardo usa WINDOWS. Por eso la carpeta de entrega lleva
#  pocketbase.exe y los .bat de Windows, no los .command de Mac. Eso es a
#  proposito: en su computadora los .command no servirian de nada.
#
#  La base de datos se crea con el pocketbase de Mac, pero el archivo que
#  queda es identico al que hace la version de Windows: PocketBase guarda
#  los datos en el mismo formato en las dos.
#
#  Equivalente de preparar-entrega.bat + herramientas/preparar-entrega.ps1
# ===========================================================================

set -e
cd "$(dirname "$0")" || exit 1
printf '\033]0;CAPINOA - preparar entrega\007'

# La clave del panel tecnico NO se escribe aca (el repositorio es publico):
# se lee del archivo privado que vive afuera, al lado de la carpeta del sistema.
CLAVES_PRIVADAS="../CAPINOA-claves-privadas.txt"
CLAVE_SOPORTE=$(grep -E '^CLINICA_SUPER_CLAVE=' "$CLAVES_PRIVADAS" 2>/dev/null | head -1 | cut -d= -f2-)
if [ -z "$CLAVE_SOPORTE" ]; then
  echo
  echo "  Falta CLINICA_SUPER_CLAVE en $CLAVES_PRIVADAS"
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi
MAIL_SOPORTE="admin@capinoa.local"

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
echo "    CAPINOA - Preparar entrega para Ricardo"
echo "  ============================================"

# Las dos piezas de Windows que van SI o SI en la entrega.
if [ ! -f "pocketbase.exe" ]; then
  echo
  echo "  *** Falta pocketbase.exe (la version Windows). ***"
  echo "  Ricardo la necesita: en su computadora el pocketbase de Mac no corre."
  echo "  Se baja de https://github.com/pocketbase/pocketbase/releases"
  echo "  (misma version que uses aca, archivo windows_amd64)"
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi
if [ ! -x "./pocketbase" ]; then
  echo
  echo "  *** Falta el programa 'pocketbase' (version Mac). ***"
  echo "  Se usa aca para crear la base de datos limpia."
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi

echo
echo "  Paso 1 : compilando las pantallas"
cd web
npm install --no-audit --no-fund --silent
npm run check
npm run build
cd ..

echo
echo "  Paso 2 : armando la carpeta"
DESTINO="$(pwd)/entrega/CAPINOA"
rm -rf "$DESTINO"
mkdir -p "$DESTINO"

cp -f  pocketbase.exe  "$DESTINO/"
cp -R  web/dist        "$DESTINO/pb_public"
cp -R  pb_migrations   "$DESTINO/pb_migrations"
cp -R  pb_hooks        "$DESTINO/pb_hooks"
cp -f  README.md       "$DESTINO/"

# Solo los .bat que le sirven a Ricardo (el usa Windows).
for f in iniciar-capinoa.bat actualizar-capinoa.bat respaldar.bat; do
  cp -f "$f" "$DESTINO/"
done
# Y solo los scripts que esos .bat usan (empaquetar y preparar son nuestros).
mkdir -p "$DESTINO/herramientas"
for f in actualizar.ps1 respaldar.ps1; do
  cp -f "herramientas/$f" "$DESTINO/herramientas/"
done

cp -f "entrega/LEEME - abrir esto primero.html" "$DESTINO/"

mkdir -p "$DESTINO/actualizaciones" "$DESTINO/respaldos"
cat > "$DESTINO/actualizaciones/QUE VA ACA.txt" <<'TXT'
Cuando Emiliano te mande una mejora del sistema, va a ser un archivo .zip.

Guardalo ACA DENTRO y despues:
  1. Cerra CAPINOA (la ventana negra).
  2. Doble clic en actualizar-capinoa.bat (esta una carpeta mas arriba).

Tus pacientes, historias, fotos, turnos y cuentas NO se tocan.
TXT
cat > "$DESTINO/respaldos/QUE VA ACA.txt" <<'TXT'
Aca se guardan las copias de seguridad de tus datos.

Para hacer una: doble clic en respaldar.bat (una carpeta mas arriba).
Despues copia la carpeta que aparece aca a un pendrive o a la nube.

IMPORTANTE: si la copia queda solo en esta computadora, no te salva de que se
rompa la notebook. Llevatela afuera.
TXT

echo
echo "  Paso 3 : creando la base de datos limpia"
# Se corre con el pocketbase de Mac, sobre la carpeta de entrega. Arma la
# estructura, los usuarios y la licencia sin arrastrar datos de prueba.
POCKETBASE_MAC="$(pwd)/pocketbase"
cd "$DESTINO"
"$POCKETBASE_MAC" migrate up 2>&1 | grep -i "applied" | sed 's/^/    /' || true
"$POCKETBASE_MAC" superuser upsert "$MAIL_SOPORTE" "$CLAVE_SOPORTE" >/dev/null
cd - >/dev/null

echo
echo "  Paso 4 : revisando que este todo bien"
PROBLEMAS=""
[ -d "$DESTINO/web" ] && PROBLEMAS="$PROBLEMAS\n    - se colo la carpeta web/ (codigo fuente)"
for p in empaquetar-actualizacion.bat compilar.bat "herramientas/empaquetar.ps1" "herramientas/preparar-entrega.ps1" "empaquetar-actualizacion.command" "preparar-entrega.command" "compilar.command"; do
  [ -e "$DESTINO/$p" ] && PROBLEMAS="$PROBLEMAS\n    - se colo $p (es herramienta nuestra)"
done
for n in pocketbase.exe "pb_public/index.html" "pb_data/data.db" "pb_hooks/licencia.pb.js" iniciar-capinoa.bat "LEEME - abrir esto primero.html"; do
  [ ! -e "$DESTINO/$n" ] && PROBLEMAS="$PROBLEMAS\n    - FALTA $n"
done
PACIENTES=$(find "$DESTINO/pb_data/storage" -type f 2>/dev/null | wc -l | tr -d ' ')
[ "$PACIENTES" -gt 0 ] && PROBLEMAS="$PROBLEMAS\n    - hay $PACIENTES archivos en pb_data/storage (deberia venir vacio)"

if [ -n "$PROBLEMAS" ]; then
  echo
  echo "  PROBLEMAS:"
  printf "$PROBLEMAS\n"
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi

TAM=$(du -sh "$DESTINO" | cut -f1)

trap - ERR
echo
echo "  LISTO. Carpeta de entrega armada:"
echo "    $DESTINO   ($TAM)"
echo
echo "  Para entregarsela a Ricardo:"
echo "    1. Copia la carpeta CAPINOA entera al pendrive."
echo "    2. Que la pegue en C:\\CAPINOA en su computadora."
echo "    3. Que abra 'LEEME - abrir esto primero.html' y siga los pasos."
echo
echo "  Panel tecnico (NO se lo des a Ricardo):"
echo "    $MAIL_SOPORTE  /  $CLAVE_SOPORTE"
echo
open entrega
read -r -p "  Enter para cerrar" _
exit 0
