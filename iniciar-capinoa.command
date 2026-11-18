#!/bin/bash
# ===========================================================================
#  CAPINOA - Sistema de gestion   (version para Mac)
#  Doble clic aca para abrir el sistema.
# ===========================================================================
#  Es el equivalente de iniciar-capinoa.bat, que es la version para Windows.
#  Los dos hacen exactamente lo mismo; cambia solo el idioma que entiende
#  cada computadora.
#
#  MIENTRAS EL SISTEMA ESTE ABIERTO, ESTA VENTANA TIENE QUE QUEDAR ABIERTA.
#  Si se cierra, el sistema se apaga (los datos no se pierden).
# ===========================================================================

cd "$(dirname "$0")" || exit 1
printf '\033]0;CAPINOA - sistema encendido (no cerrar esta ventana)\007'
clear

echo
echo "  ============================================"
echo "    CAPINOA - Sistema de gestion"
echo "  ============================================"
echo

# --- Si ya hay una copia encendida, no intentamos encender otra: -----------
#     el sistema usa la "puerta" 8090 de la computadora y solo puede haber
#     una a la vez. En vez de mostrar un error incomprensible, abrimos el
#     navegador, que es lo que la persona queria hacer.
if lsof -nP -iTCP:8090 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "  El sistema YA ESTABA ENCENDIDO."
  echo "  Te abro el navegador y listo."
  echo
  echo "  (Si lo que querias era reiniciarlo: cerra primero la"
  echo "   OTRA ventana de CAPINOA que quedo abierta, y despues"
  echo "   volve a hacer doble clic aca.)"
  echo
  open "http://127.0.0.1:8090"
  echo "  Esta ventana ya la podes cerrar."
  exit 0
fi

# --- Sin el programa pocketbase no hay sistema. Avisamos claro. ------------
if [ ! -x "./pocketbase" ]; then
  echo "  *** Falta el programa 'pocketbase' (version Mac). ***"
  echo
  echo "  Tiene que estar en esta misma carpeta, al lado de este archivo."
  echo "  Se baja de: https://github.com/pocketbase/pocketbase/releases"
  echo "  (buscar la version 0.37.4, archivo darwin_arm64)"
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi

echo "  Encendiendo... en unos segundos se abre solo"
echo "  el navegador con el sistema."
echo
echo "  NO CIERRES ESTA VENTANA mientras lo uses."
echo

( sleep 3; open "http://127.0.0.1:8090" ) &

./pocketbase serve --http=127.0.0.1:8090
CODIGO=$?

echo
if [ "$CODIGO" -ne 0 ]; then
  echo "  *** El sistema no pudo encenderse. ***"
  echo
  echo "  Sacale una foto a este mensaje y mandasela a Emiliano."
  echo
  read -r -p "  Enter para cerrar" _
  exit 1
fi

echo "  El sistema se apago. Podes cerrar esta ventana."
read -r -p "  Enter para cerrar" _
exit 0
