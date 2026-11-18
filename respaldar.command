#!/bin/bash
# ===========================================================================
#  CAPINOA - Copia de seguridad   (version para Mac)
# ===========================================================================
#  Guarda una copia de todos tus datos (pacientes, historias, fotos, turnos
#  y cuentas) en la carpeta "respaldos".
#
#  Hacelo una vez por semana y copia el resultado a un pendrive o a la nube.
#
#  Equivalente de respaldar.bat / herramientas/respaldar.ps1, que son la
#  version para Windows.
# ===========================================================================

set -e
cd "$(dirname "$0")" || exit 1
printf '\033]0;CAPINOA - copia de seguridad\007'

echo
echo "  ============================================"
echo "    CAPINOA - Copia de seguridad"
echo "  ============================================"
echo

if [ ! -d "pb_data" ]; then
  echo "  No encuentro la carpeta pb_data."
  echo "  Este archivo tiene que estar dentro de la carpeta de CAPINOA."
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi

# ¿Esta encendido? Avisamos, pero dejamos seguir.
# (La base puede quedar copiada a mitad de una escritura. Apagar primero
#  es la forma 100% segura.)
if lsof -nP -iTCP:8090 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "  ATENCION: el sistema esta encendido."
  echo "  La copia va a funcionar igual, pero lo mas seguro es cerrar"
  echo "  primero la ventana de CAPINOA y volver a correr esto."
  echo
  read -r -p "  Copiar igual? (S/N) " SEGUIR
  case "$SEGUIR" in
    [sSyY]*) echo ;;
    *) exit 0 ;;
  esac
fi

SELLO=$(date +%Y-%m-%d_%H%M)
DESTINO="respaldos/pb_data_$SELLO"

echo "  Copiando... (puede tardar si hay muchas fotos)"
mkdir -p respaldos
cp -R pb_data "$DESTINO"

TAM=$(du -sh "$DESTINO" | cut -f1)

echo
echo "  LISTO. Copia guardada en:"
echo "    $(pwd)/$DESTINO"
echo "    ($TAM)"
echo
echo "  IMPORTANTE: esta copia esta en la MISMA computadora."
echo "  Copiala tambien a un pendrive o a la nube. Si se rompe la"
echo "  notebook, esta copia se pierde junto con el original."
echo

# Dejamos abierta la carpeta para que sea facil arrastrarla al pendrive.
open respaldos

read -r -p "  Enter para cerrar" _
exit 0
