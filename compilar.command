#!/bin/bash
# ===========================================================================
#  CAPINOA - Compilar el sistema   (version para Mac; esto lo corre Emiliano)
# ===========================================================================
#  Toma el codigo de web/ , lo compila y lo deja dentro de pb_public/ , que es
#  la carpeta desde donde PocketBase sirve las pantallas.
#
#  Resultado: el sistema entero queda en UN SOLO programa, sin necesidad de
#  instalar nada en la computadora de Ricardo.
#
#  Equivalente de compilar.bat, que es la version para Windows.
# ===========================================================================

set -e
cd "$(dirname "$0")" || exit 1
printf '\033]0;CAPINOA - compilando\007'

fallo() {
  echo
  echo "  *** Hubo un error al compilar. Revisa el mensaje de arriba. ***"
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
}
trap fallo ERR

echo
echo "  Compilando el sistema..."
echo

cd web
npm install --no-audit --no-fund
npm run build
cd ..

echo
echo "  Copiando las pantallas a pb_public..."
rm -rf pb_public
cp -R web/dist pb_public

trap - ERR
echo
echo "  Listo. Ya se puede abrir con iniciar-capinoa.command"
echo
read -r -p "  Enter para cerrar" _
exit 0
