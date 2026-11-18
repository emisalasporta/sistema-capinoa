/// <reference path="../pb_data/types.d.ts" />

/**
 * Configuración del servidor a partir de las variables de entorno de Dokploy.
 * Ver `arranque.pb.js` para el porqué.
 *
 * Variables (todas opcionales):
 *
 *   CAPINOA_SUPER_EMAIL / CAPINOA_SUPER_CLAVE
 *       El superusuario del panel técnico (/_/). Queda como el ÚNICO: cualquier
 *       otro superusuario (por ejemplo el viejo que viene adentro de la copia
 *       de la clínica) se borra.
 *
 *   CAPINOA_URL
 *       La dirección pública, ej. https://sistema.capinoa.com.ar
 *
 *   RESPALDO_S3_ENDPOINT / RESPALDO_S3_BUCKET / RESPALDO_S3_REGION /
 *   RESPALDO_S3_ACCESS_KEY / RESPALDO_S3_SECRET
 *       Dónde se guardan las copias de seguridad FUERA del servidor (cualquier
 *       almacenamiento compatible con S3; se usa Cloudflare R2). Con las cinco
 *       cargadas, la copia diaria va directo ahí. Si falta alguna, las copias
 *       quedan en el propio servidor (sirve para deshacer un error, no para
 *       un servidor roto).
 *
 *   RESPALDO_CONSERVAR
 *       Cuántas copias diarias se conservan. Por defecto 14.
 */

function env(nombre) {
  return String($os.getenv(nombre) || "").trim();
}

/** El superusuario del panel técnico, según las variables de entorno. */
function superusuario(app) {
  const email = env("CAPINOA_SUPER_EMAIL");
  const clave = env("CAPINOA_SUPER_CLAVE");
  if (!email || !clave) return;
  if (clave.length < 12) {
    console.log("[arranque] CAPINOA_SUPER_CLAVE es demasiado corta (mínimo 12): no se toca el superusuario.");
    return;
  }

  let su = null;
  try {
    su = app.findAuthRecordByEmail("_superusers", email);
  } catch (_) {
    su = null;
  }

  if (!su) {
    su = new Record(app.findCollectionByNameOrId("_superusers"));
    su.set("email", email);
    su.setPassword(clave);
    app.save(su);
    console.log("[arranque] superusuario creado: " + email);
  } else if (!su.validatePassword(clave)) {
    su.setPassword(clave);
    app.save(su);
    console.log("[arranque] contraseña del superusuario actualizada.");
  }

  // Cualquier otro superusuario sobra (típicamente el de la etapa local).
  const otros = app.findRecordsByFilter("_superusers", "email != {:e}", "", 50, 0, { e: email });
  for (let i = 0; i < otros.length; i++) {
    try {
      const viejo = otros[i].getString("email");
      app.delete(otros[i]);
      console.log("[arranque] superusuario viejo borrado: " + viejo);
    } catch (err) {
      console.log("[arranque] no se pudo borrar un superusuario viejo — " + err);
    }
  }
}

/** Dirección pública y copias de seguridad. */
function ajustes(app) {
  const settings = app.settings();
  let cambio = false;

  const poner = (objeto, campo, valor) => {
    if (objeto[campo] !== valor) {
      objeto[campo] = valor;
      cambio = true;
    }
  };

  const url = env("CAPINOA_URL").replace(/\/+$/, "");
  if (url) poner(settings.meta, "appURL", url);

  const s3 = {
    endpoint: env("RESPALDO_S3_ENDPOINT"),
    bucket: env("RESPALDO_S3_BUCKET"),
    region: env("RESPALDO_S3_REGION"),
    accessKey: env("RESPALDO_S3_ACCESS_KEY"),
    secret: env("RESPALDO_S3_SECRET"),
  };
  const algunaS3 = s3.endpoint || s3.bucket || s3.accessKey || s3.secret;
  const todasS3 = s3.endpoint && s3.bucket && s3.region && s3.accessKey && s3.secret;

  if (todasS3) {
    const b = settings.backups.s3;
    poner(b, "enabled", true);
    poner(b, "endpoint", s3.endpoint);
    poner(b, "bucket", s3.bucket);
    poner(b, "region", s3.region);
    poner(b, "accessKey", s3.accessKey);
    poner(b, "secret", s3.secret);
    poner(b, "forcePathStyle", true);
  } else if (algunaS3) {
    console.log("[arranque] faltan variables RESPALDO_S3_*: las copias quedan en el servidor.");
  }

  // En el servidor (se reconoce porque trae alguna de estas variables) la
  // copia diaria corre a las 06:00 UTC = 3 de la mañana en Argentina.
  if (url || algunaS3 || env("CAPINOA_SUPER_EMAIL")) {
    const conservar = parseInt(env("RESPALDO_CONSERVAR"), 10) || 14;
    poner(settings.backups, "cron", "0 6 * * *");
    poner(settings.backups, "cronMaxKeep", conservar);
  }

  if (cambio) {
    app.save(settings);
    console.log(
      "[arranque] configuración del servidor aplicada" +
        (todasS3 ? " (copias de seguridad fuera del servidor: " + s3.bucket + ")." : ".")
    );
  }
}

function aplicar(app) {
  superusuario(app);
  ajustes(app);
}

module.exports = { aplicar };
