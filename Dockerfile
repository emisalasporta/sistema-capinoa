# Receta de publicación del sistema CAPINOA (mismo molde que el sistema DPRD).
#
# Compila las pantallas (Astro) y las sirve junto con la base de datos
# (PocketBase) en un solo servicio: PocketBase atiende los datos en /api y las
# pantallas en /. Los datos reales viven en el volumen persistente /pb/pb_data
# (NO van dentro de la imagen: se montan aparte desde Dokploy, y por eso
# sobreviven a cada actualización).

# ---- Etapa 1: compilar las pantallas (Astro) ----
FROM node:22-alpine AS web
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# No hace falta decirle a las pantallas dónde está el servidor: le hablan a la
# misma dirección desde la que se abrieron (ver web/src/lib/pocketbase.ts).
RUN npm run build

# ---- Etapa 2: servidor PocketBase + pantallas ya compiladas ----
FROM alpine:3.20
# Misma versión de PocketBase que la de la clínica: la copia de datos se muda tal cual.
ARG PB_VERSION=0.37.4
RUN apk add --no-cache ca-certificates unzip wget tzdata
# Reloj de Catamarca: la licencia y los registros usan la fecha local.
ENV TZ=America/Argentina/Catamarca
WORKDIR /pb
RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip -q pocketbase_${PB_VERSION}_linux_amd64.zip \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip
# Estructura de la base (las migraciones se aplican solas al arrancar) y lógica del servidor
COPY pb_migrations/ /pb/pb_migrations/
COPY pb_hooks/ /pb/pb_hooks/
# Pantallas compiladas: PocketBase sirve automáticamente lo que haya en pb_public
COPY --from=web /app/dist/ /pb/pb_public/
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8090/api/health || exit 1
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
