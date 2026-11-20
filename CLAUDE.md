# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Qué es

Sistema de gestión del centro de implante capilar **CAPINOA** (Dr. Ricardo Molina,
Catamarca). Pacientes, historia clínica tricológica, fotos y marcado sobre la foto.
**Todo el código, la UI y los comentarios van en español rioplatense** (voseo en los
textos que lee el usuario). Escribí igual: naming, comentarios, mensajes de commit.

El usuario (Emiliano) **no es técnico**: los textos de pantalla, los avisos de error
y la documentación tienen que explicarse sin jerga.

## ⚠️ El repositorio es PÚBLICO

`github.com/emisalasporta/sistema-capinoa` es público porque Dokploy clona sin
credenciales. Por eso **nunca** entran al repo: datos de pacientes (`pb_data`),
respaldos, paquetes, la carpeta `entrega`, contraseñas, claves ni correos
personales. Antes de escribir un valor sensible en cualquier archivo de esta
carpeta, frená: va en `../CAPINOA-claves-privadas.txt` (fuera del repo) o en las
variables de entorno de Dokploy. Las migraciones que crean usuarios usan
`setRandomPassword()`, nunca una contraseña escrita.

## Stack

- **Backend: PocketBase 0.37.4** — servidor + SQLite + auth + archivos.
  Esquema en `pb_migrations/`, lógica server-side en `pb_hooks/`. El binario y
  `pb_data/` no se versionan; las migraciones sí. **Misma versión en la Mac, en
  la clínica y en el servidor** (`PB_VERSION` del Dockerfile): si se sube una,
  se suben todas.
- **Frontend: Astro** (`web/`), `output: "static"`. Sin framework de UI: Astro +
  `<script>` vanilla + `innerHTML`. **Todos los datos se piden del lado del cliente**
  a la API de PocketBase.
- **Un solo servicio:** el build de Astro va a `pb_public/` y PocketBase sirve
  API + pantallas juntas. En el servidor lo arma el `Dockerfile`; en la Mac,
  `compilar.command`. Por eso las pantallas le hablan **a la misma dirección
  desde la que se abrieron** (`lib/pocketbase.ts`): no hay URL que configurar y
  anda igual en la dirección provisoria y en la definitiva. `PUBLIC_POCKETBASE_URL`
  (en `web/.env`) solo existe para `npm run dev`.

Es el mismo stack del sistema **DPRD** (`secretaria-de-deportes/sistema-gestion-dprd/`),
o sea que hay piezas reutilizables ahí.

## Comandos

Desde `web/`:
```
npm install
npm run dev     # http://localhost:4321  (preview_start "capinoa-web")
npm run check   # astro check — dejarlo en 0 errores antes de dar algo por cerrado
npm run build   # astro build → web/dist/
```

PocketBase, desde la raíz (en la Mac es `./pocketbase`; en Windows, `pocketbase.exe`):
```
./pocketbase serve            # API + panel en http://127.0.0.1:8090/_/
./pocketbase migrate up       # aplicar migraciones sin levantar el servidor
```

Usuarios y contraseñas de prueba de la copia local: en
`../CAPINOA-claves-privadas.txt`. **No copiarlos a ningún archivo de esta carpeta.**

## En internet: cómo se publica y se actualiza

Mismo molde que el sistema DPRD. Vive en el VPS de Emiliano (Hostinger) con
**Dokploy** (`http://72.60.151.150:3000`, Traefik adelante).

- **Dirección definitiva:** `https://sistema.capinoa.com.ar` (el registro DNS lo
  carga César, que maneja el dominio). **Provisoria:**
  `https://capinoa.emilianosalasporta.cloud` (Cloudflare de Emiliano, solo DNS,
  sin proxy naranja: el certificado lo saca Traefik con letsencrypt y la nube
  naranja además limita las subidas a 100 MB, que rompe la mudanza).
- **Dokploy:** Application · Provider **Git** (no la integración de GitHub) ·
  repo público por https · sin SSH key · rama `main` · Build Type **Dockerfile** ·
  puerto **8090** · dominio con HTTPS + letsencrypt · **volumen** `capinoa-datos`
  montado en **`/pb/pb_data`** (ahí viven la base y las fotos; sobrevive a cada
  deploy).
- **Actualizar:** editar → `npm run check` en 0 → doble clic en
  **`SUBIR-CAMBIOS.command`**. Hace commit, push con la cuenta `emisalasporta`
  (`gh` tiene dos cuentas; la activa es otra, por eso el script pasa la llave a
  mano) y espera a que el servidor muestre el sello nuevo en `/version.txt`.
  El push dispara el deploy por un webhook de GitHub → Dokploy
  (`CONECTAR-AUTOPUBLICACION.command`, una sola vez). Las migraciones nuevas se
  aplican solas al arrancar.
- **Variables de entorno (Dokploy → Environment).** Las lee `pb_hooks/lib_arranque.js`
  en cada arranque; los valores están en el archivo de claves privado:

  | Variable | Para qué |
  |---|---|
  | `CAPINOA_SUPER_EMAIL`, `CAPINOA_SUPER_CLAVE` | Superusuario del panel `/_/`. Queda como el ÚNICO: cualquier otro se borra. Cambiar la clave = cambiar la variable y redeploy. |
  | `CAPINOA_URL` | Dirección pública (para los adjuntos de los reportes). |
  | `RESPALDO_S3_ENDPOINT`, `_BUCKET`, `_REGION`, `_ACCESS_KEY`, `_SECRET` | Copias diarias fuera del servidor (Cloudflare R2). Sin las cinco, las copias quedan en el volumen. |
  | `RESPALDO_CONSERVAR` | Cuántas copias diarias se guardan (14). |
  | `RESEND_API_KEY`, `RESEND_FROM`, `REPORTES_DESTINO` | Opcional: aviso por correo de cada reporte. Sin esto, los reportes se ven solo en Configuración. |

- **Copias de seguridad:** backup nativo de PocketBase, 06:00 UTC (3 AM de acá),
  directo al bucket S3 cuando están las variables. Restaurar: panel `/_/` →
  Settings → Backups → Restore (PocketBase se reinicia solo y `arranque.pb.js`
  vuelve a dejar el superusuario y la configuración). Probado el 18/11/2026 con
  Docker: borrar un paciente con sus fotos → restaurar → vuelve todo.
- **Aviso si se cae:** `.github/workflows/vigilar.yml` pregunta cada 10 minutos
  por `/api/health` desde GitHub; si falla, GitHub le manda un correo al dueño
  del repo. Una dirección que todavía no existe en DNS se saltea.
- **Mudanza de datos desde la clínica:** en la clínica, cerrar el sistema y
  correr `respaldar.bat`; traer la carpeta `respaldos\pb_data_FECHA`; en la Mac,
  `herramientas/subir-datos-al-servidor.command` (la comprime, la sube como
  backup, la restaura, compara cantidades) y después
  `herramientas/claves-nuevas.command`. Se puede repetir: cada vez reemplaza
  TODO lo online por la copia.
- **Probar la imagen en la Mac antes de publicar algo delicado:**
  ```
  docker build --platform linux/amd64 -t capinoa-prueba .
  docker run -d --name capinoa-prueba -p 8091:8090 -v capinoa-prueba-datos:/pb/pb_data \
    -e CAPINOA_SUPER_EMAIL=soporte@prueba.test -e CAPINOA_SUPER_CLAVE=una-clave-de-prueba-larga capinoa-prueba
  ```
  y abrir http://localhost:8091. Al terminar: `docker rm -f capinoa-prueba`.

## Seguridad en internet (no aflojar)

- **Contraseñas provisorias.** `equipo.debe_cambiar_clave` lo maneja SOLO el
  servidor (`pb_hooks/seguridad.pb.js`): se prende cuando la contraseña la pone
  otro (admin, superusuario, alta nueva) y se apaga cuando la persona cambia la
  suya. El guard `requiereSesion()` manda a `/cambiar-clave/` mientras esté
  prendido. Mínimo 10 caracteres (`LARGO_MINIMO_CLAVE` espeja el `min` del campo).
- **Nadie se sube el rol.** La `updateRule` de `equipo` deja que cada uno edite
  su registro (hace falta para cambiar la contraseña) pero rechaza el pedido si
  trae `rol`, `activo`, `verified` o `debe_cambiar_clave`. Si se agrega otro
  campo de privilegio a `equipo`, sumarlo a esa regla.
- **Límite de intentos** (`settings.rateLimits`, migración `1756000160`): 8
  ingresos por minuto por IP. La IP real sale de
  `X-Forwarded-For` (Traefik); sin eso todos comparten la misma.
- **Archivos protegidos:** `fotos.archivo`, `marcados.render` y
  `reportes.captura`. Un campo de archivo nuevo con algo de un paciente nace con
  `protected: true`.
- **Superusuario:** uno solo, definido por variables de entorno. No crear otros
  desde el panel: el próximo arranque los borra.

## Arquitectura: las tres capas de la ficha

Esta es **la** decisión de diseño del proyecto. La historia clínica tiene ~200
preguntas; está partida por **quién la contesta**, no por cuándo:

| Capa | Dónde vive | Quién |
|---|---|---|
| 1 · Datos personales | collection `pacientes` (columnas reales) | Recepción / el paciente |
| 2 · Anamnesis | collection `historias`, campo `respuestas` (json) | **El paciente sobre sí mismo** |
| 3 · Evaluación médica | collection `evaluaciones`, campo `datos` (json) | Solo el médico |

Cada sección del cuestionario lleva `quien: "paciente" | "medico"`. Ese campo es lo
que permitirá generar el **formulario online** publicando las secciones con
`quien = "paciente"` — sin escribir un formulario nuevo.

### El cuestionario vive en UN archivo

`web/src/lib/cuestionario.ts` describe todas las secciones y preguntas.
`web/src/lib/formulario.ts` las dibuja, las activa y las vuelve a leer.

**Agregar una pregunta = agregar una línea.** No hay migración ni pantalla que tocar.
Por eso las respuestas se guardan en campos `json` y no en columnas.

⚠️ **Nunca cambiar el `id` de una pregunta ya en uso**: las respuestas guardadas
quedan huérfanas. El `label` (texto visible) sí se puede cambiar libremente.

Formato de las respuestas guardadas:
```
texto/texto_largo/numero/fecha/opcion → "texto"
si_no                                 → "si" | "no"
si_no_detalle                         → { valor: "si"|"no", detalle: "…" }
multiple                              → ["opción 1", "opción 2"]
```
`alertas()` en `cuestionario.ts` lee ese formato para las banderas rojas de la ficha.

## Permisos

Se aplican **dos veces**:
1. **En el servidor** (reglas de las collections, en las migraciones). Es la barrera real.
2. **En el navegador** (`lib/auth.ts`), solo para no mostrar botones que van a fallar.

Regla de negocio del cliente: **recepción NO ve historias clínicas ni fotos.**
`historias`, `evaluaciones`, `fotos`, `marcados` y `movimientos` están cerradas a
`admin` / `medico`. `pacientes` y `turnos` las ve todo el equipo.

## Landmines conocidas

- **`created` / `updated` NO se crean solos.** Desde PocketBase 0.23 hay que
  declararlos como campos `autodate` (ver `1756000100_fechas_automaticas.js`). Sin
  ellos, cualquier `sort=-created` devuelve **400**. Si se agrega una collection
  nueva, agregarle los dos campos.
- **Fechas y zona horaria.** PocketBase guarda `"1988-03-14 00:00:00.000Z"`. Convertir
  eso con `new Date()` en Argentina (UTC-3) muestra **un día antes**. Las fechas se
  formatean como TEXTO en `lib/ui.ts` (`fecha`, `fechaInput`, `edad`). **No usar
  `toLocaleDateString` sobre fechas de PocketBase.**
- **Turnos = hora del reloj del consultorio.** `turnos.inicio/fin` guardan la hora
  local tal cual, etiquetada como Z (ej. las 15:00 se guardan `15:00:00.000Z`). Es
  deliberado: un turno es "las tres de la tarde en Prado 444", no un instante
  global; todos los usuarios están en el mismo lugar. Nunca convertir husos acá, y
  filtrar por día con `rangoDelDia()` (comparación de texto). Helpers: `hora`,
  `unirFechaHora`, `sumarMinutos`, `sumarDias`, `semanaDe` en `lib/ui.ts`.
- **Imágenes y lienzo.** Las fotos son archivos `protected`: hay que pedir un token
  y bajarlas con `fetch` → `objectURL` (`lib/archivos.ts`). Poner la URL directo en
  un `<img>` "ensucia" el canvas y **rompe la exportación del marcado a PNG**.
- **Campos `select`.** Guardar un valor que no esté en la lista hace que PocketBase
  rechace el guardado **en silencio**. Agregar el valor por migración primero.
- **Relaciones vacías.** PocketBase no acepta `""` en un campo relación: mandar `null`.
- **`movimientos.monto` siempre positivo.** El signo lo da `tipo` (`ingreso`/`egreso`).
  Guardar negativos rompe los totales. Las categorías se ofrecen por tipo
  (`CATEGORIAS_INGRESO` / `CATEGORIAS_EGRESO` en `lib/ui.ts`).
- **Puerto 8090 ocupado.** En local solo puede correr una instancia. Al terminar
  de trabajar, **cortar el PocketBase que se haya dejado corriendo**.
- **`onServe` no existe como función suelta** en los hooks JS de esta versión.
  Lo que tiene que correr al arrancar va en `onBootstrap`, después de `e.next()`
  (ver `arranque.pb.js`, que además corre las migraciones antes de configurar).
- **`<style>` scoped de Astro + `innerHTML`.** No estiliza el HTML inyectado por JS.
  Todo lo que se use en contenido inyectado tiene que estar en `styles/components.css`.
- **Enlaces internos: SIEMPRE barra final antes del `?`.** Usar `enlace()` de
  `lib/ui.ts`, nunca armar la dirección a mano. Ya pasó una vez y costó caro:
  servido desde PocketBase, `/pacientes/ficha?id=X` redirige a `/pacientes/ficha/`
  **descartando el `?id=X`** → la ficha no encuentra el paciente y rebota al
  listado. Como el 301 es permanente, el navegador lo cachea y reintentar no
  arregla nada. En el dev server de Astro NO se reproduce: **verificar siempre en
  el puerto 8090**, que es como lo usa Ricardo.
- **Nunca cerrar sesión por una falla de red.** `sincronizarSesion()` solo limpia
  el authStore ante un **401/403** explícito. Antes cerraba sesión ante cualquier
  error, y como el navegador cancela los pedidos en curso al navegar a otra
  pantalla, sacaba al usuario al login de la nada. Mismo criterio para cualquier
  código nuevo que toque `pb.authStore.clear()`.

## Diseño: una sola altura y una sola escala

- **`--alto-control` (40px) y `--alto-control-sm` (34px)** en `tokens.css`. Todo
  control interactivo (botón, input, select, `.switch`, `.sino`, `.icon-btn`) usa
  `height`, **nunca** una altura derivada del `padding`. Es lo que evita que una
  barra tenga controles de 32, 36, 42 y 44 px.
- **Escala de espaciado `--esp-1..5`** (6/10/16/22/30). No inventar números
  sueltos en `style="margin:…"`: si hace falta separación, sale de la escala o
  de una clase (`.section-title`, `.section-desc`, `.toolbar`, `.apilado`).
- **`.toolbar > .grupo`** para agrupar controles: al angostarse la pantalla baja
  el bloque entero en vez de dejar un botón colgado solo.
- `.section-title` trae margen **arriba y abajo**; se anula solo cuando es el
  primer hijo de un contenedor conocido. No volver a `:not(:first-child)`: fallaba
  con títulos que abren un `<div>` agrupador (quedaban pegados a la tabla previa).
- Auditar alineación midiendo, no a ojo: comparar `getBoundingClientRect()` de
  los controles de cada `.toolbar` (mismo alto y mismo centro vertical).

## Licencia / período de prueba

**Desde el 20/11/2026 no hay período de prueba ni clave de activación** (pedido de
Emiliano: el sistema vive en su servidor y Ricardo aceptó el precio).

- `estado()` en `pb_hooks/lib_licencia.js` devuelve **siempre** `activado: true`,
  sin leer la collection. Por eso una mudanza de datos de la clínica, que trae
  el registro de `licencia` como estaba (quizás sin activar), no bloquea a nadie.
- `licencia.pb.js` solo expone `GET /api/capinoa/licencia` (siempre
  `"activado": true`). Ya no hay bloqueo en `onRecordAuthRequest` ni ruta
  `/api/capinoa/activar`.
- En pantalla: sin barra de días de prueba, sin botón de clave en el login, y en
  Configuración la sección Licencia dice solo «Sistema activado».
- La collection `licencia` **se conserva tal cual** (no borrarla: es parte de los
  datos). El límite de intentos de `POST /api/capinoa/activar` sigue en la
  migración `1756000160` pero no hace nada; no editar esa migración.

## La versión local de la clínica (en retirada)

Los `.bat`, `herramientas/*.ps1`, `empaquetar-actualizacion.command` y
`preparar-entrega.command` son de la etapa en que el sistema corría en la
notebook de la clínica. Se conservan mientras dure la semana de prueba online.
Lo que sigue valiendo de esa etapa:

- **`pb_data/` no se toca nunca** desde un script de actualización.
- **Copiar carpetas con `robocopy`, no con `Copy-Item`** (rutas de más de 260
  caracteres por las miniaturas).
- Las fotos se suben con **nombre corto** (`frontal-2026-08-18-1.jpg`); lo mismo
  las capturas de los reportes (`captura.png`).

## Migraciones

- Archivos en `pb_migrations/`, nombre `<numero>_descripcion.js`, se aplican en orden
  alfabético. La serie local es `17560000xx_`: al crear una nueva, seguí con el
  **siguiente número consecutivo**.
- **Nunca editar una migración ya aplicada.** Para cambiar el esquema, crear una nueva.
- Hacerlas **idempotentes** (crear solo lo que falta).

## Convenciones

- Verificar el **render real** en el navegador (preview server) antes de dar algo por
  cerrado. Emiliano es exigente con la estética y la alineación.
- La identidad visual sale de la landing aprobada (`../capinoa-boceto.html`) y de la
  demo aprobada (`../capinoa-sistema-demo.html`): navy `#12385F`, blue `#1E5C93`,
  teal `#16A9B8`. Está toda en `styles/tokens.css`.
- **Límite legal deliberado:** el sistema hace *gestión*, NO diagnóstico automático ni
  simulación con IA que "rellena pelo". El marcado es dibujo manual del médico. No
  agregar nada que prometa un resultado.
