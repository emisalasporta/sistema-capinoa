#!/bin/bash
# ===========================================================================
#  CAPINOA - Contrasenas nuevas (provisorias)
# ---------------------------------------------------------------------------
#  Le pone una contrasena provisoria, al azar, a cada persona del equipo en
#  el sistema que esta en internet, y las anota en el archivo de claves.
#  Cada persona esta obligada a cambiarla por una propia la primera vez que
#  entra: la provisoria sirve una sola vez.
#
#  Cuando usarlo:
#    - Despues de la mudanza (las contrasenas viejas de la clinica eran
#      conocidas y flojas).
#    - Cuando alguien se olvido la suya (se elige solo a esa persona).
# ===========================================================================
source "$(dirname "$0")/comun.sh"
titulo "contrasenas nuevas"
cargar_claves

echo "  Sistema: $URL"
echo
servidor_responde || fallo "El sistema no responde en $URL"
entrar_al_servidor || fallo "No pude entrar al panel tecnico." "Revisa que la clave del archivo sea la misma que esta cargada en Dokploy."

LISTA=$(curl -s --max-time 30 "$URL/api/collections/equipo/records?perPage=200&sort=nombre&filter=activo%3Dtrue" -H "Authorization: $TOKEN")
echo "$LISTA" | python3 -c '
import sys,json
for u in json.load(sys.stdin).get("items",[]):
    print("    - %-28s %s" % (u.get("nombre",""), u.get("email","")))'
echo
echo "  Enter           = contrasena nueva para TODOS los de la lista"
echo "  o escribi el correo de UNA sola persona"
read -r -p "  > " SOLO
echo
read -r -p "  Seguro? Las contrasenas actuales dejan de servir. (S/N) " OK
case "$OK" in [sSyY]*) ;; *) echo "  No se cambio nada."; cerrar 0 ;; esac

RESULTADO=$(echo "$LISTA" | URL="$URL" TOKEN="$TOKEN" SOLO="$SOLO" python3 -c '
import sys, json, os, secrets, urllib.request

url, token, solo = os.environ["URL"], os.environ["TOKEN"], os.environ["SOLO"].strip().lower()
# Sin letras ni numeros que se confundan al dictarlos (0/o, 1/l/i).
letras = "abcdefghjkmnpqrstuvwxyz23456789"
def provisoria():
    return "-".join("".join(secrets.choice(letras) for _ in range(4)) for _ in range(3))

hechos = 0
for u in json.load(sys.stdin).get("items", []):
    if solo and u.get("email","").lower() != solo:
        continue
    clave = provisoria()
    datos = json.dumps({"password": clave, "passwordConfirm": clave}).encode()
    pedido = urllib.request.Request(
        "%s/api/collections/equipo/records/%s" % (url, u["id"]), data=datos, method="PATCH",
        headers={"Content-Type": "application/json", "Authorization": token})
    try:
        urllib.request.urlopen(pedido, timeout=30).read()
        print("OK|%s|%s|%s" % (u.get("nombre",""), u.get("email",""), clave))
        hechos += 1
    except Exception as e:
        print("ERROR|%s|%s|%s" % (u.get("nombre",""), u.get("email",""), e))
if not hechos:
    print("NADA|||")
')

if echo "$RESULTADO" | grep -q '^NADA'; then
  fallo "No se cambio ninguna contrasena." "Si escribiste un correo, fijate que sea igual al de la lista."
fi

{
  echo
  echo "# --- Contrasenas provisorias puestas el $(date '+%d/%m/%Y %H:%M') en $URL ---"
  echo "# (cada persona la cambia en su primer ingreso; despues esta linea ya no sirve)"
  echo "$RESULTADO" | grep '^OK' | while IFS='|' read -r _ nombre correo clave; do
    printf '#   %-26s %-34s %s\n' "$nombre" "$correo" "$clave"
  done
} >> "$CLAVES"

echo
echo "  LISTO."
echo "$RESULTADO" | grep '^OK' | while IFS='|' read -r _ nombre correo _; do
  echo "    - $nombre ($correo): contrasena provisoria puesta"
done
echo "$RESULTADO" | grep '^ERROR' | while IFS='|' read -r _ nombre correo error; do
  echo "    - $nombre ($correo): NO se pudo cambiar ($error)"
done
echo
echo "  Las contrasenas quedaron anotadas al final del archivo de claves."
echo "  Se abre ahora: pasale a cada persona la suya (y despues a Bitwarden)."
[ -n "$CAPINOA_SIN_ABRIR" ] || open -t "$CLAVES" 2>/dev/null
cerrar 0
