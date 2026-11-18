#!/bin/bash
# ===========================================================================
#  CAPINOA - conectar la publicacion automatica   (se usa UNA sola vez)
# ---------------------------------------------------------------------------
#  Le dice a GitHub que, cada vez que se suben cambios, le avise al servidor
#  (Dokploy) para que los publique solo. Sin esto, despues de cada
#  SUBIR-CAMBIOS habria que entrar a Dokploy y apretar Deploy a mano.
#
#  Hace falta un dato que da Dokploy: la "Webhook URL" de la aplicacion
#  (pestana Deployments). Se pega aca y listo.
# ===========================================================================
source "$(dirname "$0")/herramientas/comun.sh"
titulo "conectar la publicacion automatica"

CUENTA="emisalasporta"
REPO="$CUENTA/sistema-capinoa"
export GH_TOKEN=$(gh auth token --user "$CUENTA" 2>/dev/null)
[ -n "$GH_TOKEN" ] || fallo "No encuentro la sesion de GitHub de $CUENTA en esta Mac."

echo "  Pega aca la Webhook URL que muestra Dokploy y apreta Enter:"
read -r -p "  > " GANCHO
GANCHO=$(echo "$GANCHO" | tr -d ' \r\n')
case "$GANCHO" in
  http*://*/api/deploy/*) ;;
  *) fallo "Eso no parece la Webhook URL de Dokploy." "Tiene que ser parecida a http://72.60.151.150:3000/api/deploy/...." ;;
esac

# Si ya habia una conexion anterior, se reemplaza (para no publicar dos veces).
for id in $(gh api "repos/$REPO/hooks" --jq '.[] | select(.config.url | test("/api/deploy/")) | .id' 2>/dev/null); do
  gh api -X DELETE "repos/$REPO/hooks/$id" >/dev/null 2>&1
done

if gh api -X POST "repos/$REPO/hooks" -f name=web -F active=true -f 'events[]=push' \
     -f "config[url]=$GANCHO" -f 'config[content_type]=json' -f 'config[insecure_ssl]=0' >/dev/null; then
  echo
  echo "  LISTO: desde ahora, cada SUBIR-CAMBIOS se publica solo."
  cerrar 0
fi
fallo "GitHub no acepto la conexion."
