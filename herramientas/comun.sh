# ===========================================================================
#  Piezas compartidas por los programas de doble clic de la Mac.
#  No se ejecuta solo: lo cargan los .command con "source".
# ===========================================================================

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# El archivo de claves vive FUERA del repositorio (que es publico).
CLAVES="${CAPINOA_CLAVES:-$RAIZ/../CAPINOA-claves-privadas.txt}"

titulo() {
  printf '\033]0;CAPINOA - %s\007' "$1"
  clear
  echo
  echo "  ================================================"
  echo "    CAPINOA - $1"
  echo "  ================================================"
  echo
}

cerrar() {
  echo
  read -r -p "  Enter para cerrar" _
  exit "${1:-0}"
}

fallo() {
  echo
  echo "  *** $1 ***"
  [ -n "$2" ] && echo "  $2"
  echo "  Sacale una captura a esta ventana y pasasela a Alex."
  cerrar 1
}

# Lee un valor CLAVE=valor del archivo de claves.
clave_de() {
  grep -E "^$1=" "$CLAVES" 2>/dev/null | tail -1 | cut -d= -f2-
}

cargar_claves() {
  [ -f "$CLAVES" ] || fallo "No encuentro el archivo de claves." "Tendria que estar en: $CLAVES"
  URL="${CAPINOA_URL:-$(clave_de CAPINOA_URL)}"
  URL="${URL%/}"
  SUPER_EMAIL="$(clave_de CAPINOA_SUPER_EMAIL)"
  SUPER_CLAVE="$(clave_de CAPINOA_SUPER_CLAVE)"
  [ -n "$URL" ] || fallo "Falta CAPINOA_URL en el archivo de claves."
  [ -n "$SUPER_EMAIL" ] && [ -n "$SUPER_CLAVE" ] || fallo "Faltan los datos del superusuario en el archivo de claves."
}

# Saca un campo de un JSON que llega por la entrada.  uso: ... | json campo
json() {
  python3 -c 'import sys,json
try:
    d=json.load(sys.stdin)
except Exception:
    sys.exit(0)
for k in sys.argv[1].split("."):
    d=d.get(k,"") if isinstance(d,dict) else ""
print(d if d is not None else "")' "$1"
}

# Entra al panel tecnico y deja el permiso en $TOKEN.
entrar_al_servidor() {
  local cuerpo
  cuerpo=$(python3 -c 'import json,sys; print(json.dumps({"identity":sys.argv[1],"password":sys.argv[2]}))' "$SUPER_EMAIL" "$SUPER_CLAVE")
  TOKEN=$(curl -s --max-time 30 -X POST "$URL/api/collections/_superusers/auth-with-password" \
    -H 'Content-Type: application/json' -d "$cuerpo" | json token)
  [ -n "$TOKEN" ]
}

servidor_responde() {
  curl -sf --max-time 10 "$URL/api/health" >/dev/null 2>&1
}
