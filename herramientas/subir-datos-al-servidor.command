#!/bin/bash
# ===========================================================================
#  CAPINOA - Mudanza: subir los datos de la clinica al servidor
# ---------------------------------------------------------------------------
#  Toma la copia que se saco en la compu de la clinica con respaldar.bat
#  (una carpeta "pb_data_FECHA") y la deja funcionando en internet.
#
#  OJO: REEMPLAZA todo lo que haya en el sistema online por lo de la copia.
#  Es para el dia de la mudanza (y para volver a mudar si esa semana se
#  siguio cargando en la clinica).
#
#  Que hace, en orden:
#    1. Revisa que la carpeta sea una copia de CAPINOA.
#    2. La comprime (sin las copias viejas que trae adentro).
#    3. La sube al servidor y le pide que la restaure.
#    4. Espera a que el sistema vuelva a encender y comprueba que la
#       cantidad de pacientes sea la misma que en la copia.
#    5. Ofrece poner las contrasenas nuevas.
# ===========================================================================
source "$(dirname "$0")/comun.sh"
titulo "mudanza de datos al servidor"
cargar_claves

echo "  Sistema de destino: $URL"
echo
echo "  Arrastra aca la carpeta de la copia (la que se llama pb_data_...)"
echo "  y apreta Enter:"
read -r -p "  > " CARPETA
# Al arrastrar, la Terminal escribe la ruta con barras invertidas o comillas.
CARPETA=$(python3 -c 'import sys,shlex; p=shlex.split(sys.argv[1]); print(p[0] if p else "")' "$CARPETA")
CARPETA="${CARPETA%/}"

[ -d "$CARPETA" ] || fallo "Eso no es una carpeta." "$CARPETA"
# Por si arrastro la carpeta de CAPINOA entera en vez de la copia.
[ -f "$CARPETA/data.db" ] || { [ -f "$CARPETA/pb_data/data.db" ] && CARPETA="$CARPETA/pb_data"; }
[ -f "$CARPETA/data.db" ] || fallo "En esa carpeta no esta la base de CAPINOA (data.db)."

contar() { sqlite3 "$CARPETA/data.db" "select count(*) from $1" 2>/dev/null || echo "?"; }
PACIENTES=$(contar pacientes); FOTOS=$(contar fotos); TURNOS=$(contar turnos)
TAM=$(du -sh "$CARPETA" | cut -f1)
[ "$PACIENTES" != "?" ] || fallo "No pude leer la base de esa carpeta." "Puede estar danada o a medio copiar."

echo
echo "  La copia tiene: $PACIENTES pacientes, $FOTOS fotos, $TURNOS turnos ($TAM)."
echo
servidor_responde || fallo "El sistema no responde en $URL"
entrar_al_servidor || fallo "No pude entrar al panel tecnico." "Revisa que la clave del archivo sea la misma que esta cargada en Dokploy."

echo "  ATENCION: esto BORRA lo que hoy tenga el sistema online y lo"
echo "  reemplaza por esta copia."
read -r -p "  Para seguir escribi MUDAR y Enter: " OK
[ "$OK" = "MUDAR" ] || { echo "  No se toco nada."; cerrar 0; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
NOMBRE="mudanza_$(date +%Y%m%d_%H%M%S).zip"

echo
echo "  1/4  Comprimiendo la copia..."
( cd "$CARPETA" && zip -q -r "$TMP/$NOMBRE" . -x 'backups/*' -x '.pb_temp_to_delete/*' -x '*.DS_Store' -x 'types.d.ts' ) \
  || fallo "No pude comprimir la copia."

echo "  2/4  Subiendo al servidor ($(du -h "$TMP/$NOMBRE" | cut -f1))... puede tardar."
HTTP=$(curl -s -o "$TMP/subida.txt" -w '%{http_code}' --max-time 3600 -X POST "$URL/api/backups/upload" \
  -H "Authorization: $TOKEN" -F "file=@$TMP/$NOMBRE")
[ "$HTTP" = "204" ] || [ "$HTTP" = "200" ] || fallo "El servidor no acepto la copia (respuesta $HTTP)." "$(cat "$TMP/subida.txt")"

echo "  3/4  Restaurando..."
HTTP=$(curl -s -o "$TMP/restaurar.txt" -w '%{http_code}' --max-time 600 -X POST "$URL/api/backups/$NOMBRE/restore" \
  -H "Authorization: $TOKEN")
[ "$HTTP" = "204" ] || [ "$HTTP" = "200" ] || fallo "El servidor no pudo restaurar (respuesta $HTTP)." "$(cat "$TMP/restaurar.txt")"

echo "  4/4  Esperando a que el sistema vuelva a encender..."
sleep 8
LISTO=""
for _ in $(seq 1 60); do
  if servidor_responde && entrar_al_servidor; then LISTO=1; break; fi
  sleep 3
done
[ -n "$LISTO" ] || fallo "El sistema no volvio a responder despues de restaurar." "Abri Dokploy y mira los registros (Logs) de la aplicacion."

EN_SERVIDOR=$(curl -s --max-time 30 "$URL/api/collections/pacientes/records?perPage=1&fields=id" -H "Authorization: $TOKEN" | json totalItems)
FOTOS_SERVIDOR=$(curl -s --max-time 30 "$URL/api/collections/fotos/records?perPage=1&fields=id" -H "Authorization: $TOKEN" | json totalItems)

# La copia subida ya cumplio su funcion: no se deja ocupando lugar.
curl -s -o /dev/null --max-time 60 -X DELETE "$URL/api/backups/$NOMBRE" -H "Authorization: $TOKEN"

echo
if [ "$EN_SERVIDOR" = "$PACIENTES" ] && [ "$FOTOS_SERVIDOR" = "$FOTOS" ]; then
  echo "  LISTO: la mudanza salio bien."
  echo "    En el servidor hay $EN_SERVIDOR pacientes y $FOTOS_SERVIDOR fotos, igual que en la copia."
else
  echo "  *** OJO: los numeros no coinciden. ***"
  echo "    Copia:    $PACIENTES pacientes, $FOTOS fotos"
  echo "    Servidor: $EN_SERVIDOR pacientes, $FOTOS_SERVIDOR fotos"
  echo "  Sacale una captura a esta ventana y pasasela a Alex."
  cerrar 1
fi

echo
echo "  Falta un paso: las contrasenas que venian de la clinica eran flojas."
read -r -p "  Poner ahora contrasenas nuevas a todo el equipo? (S/N) " OK
case "$OK" in [sSyY]*) exec "$(dirname "$0")/claves-nuevas.command" ;; esac
cerrar 0
