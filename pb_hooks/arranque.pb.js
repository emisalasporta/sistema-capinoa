/// <reference path="../pb_data/types.d.ts" />

/**
 * Lo que el sistema acomoda solo cada vez que arranca en el servidor.
 *
 * Todo sale de las VARIABLES DE ENTORNO que se cargan en Dokploy (pestaña
 * Environment). Así ninguna clave queda escrita en el repositorio, que es
 * público. Si una variable no está, esa parte simplemente no se toca: en la
 * computadora de la clínica o en la Mac no hay ninguna y todo sigue igual.
 *
 * Corre en cada arranque, incluido el que hace PocketBase solo después de
 * restaurar una copia de seguridad. Eso es lo que permite mudar los datos de
 * la clínica: la copia trae su propio superusuario viejo y su configuración
 * vieja, y al arrancar este archivo vuelve a dejar todo como corresponde.
 *
 * La lógica vive en `lib_arranque.js` (se carga con require() adentro del
 * hook, por la misma limitación explicada en licencia.pb.js).
 */
onBootstrap((e) => {
  // Primero se deja terminar el arranque (base de datos abierta).
  e.next();

  // Solo en el servidor: sin estas variables no hay nada que acomodar.
  const enServidor =
    $os.getenv("CAPINOA_SUPER_EMAIL") || $os.getenv("CAPINOA_URL") || $os.getenv("RESPALDO_S3_BUCKET");
  if (!enServidor) return;

  try {
    // Primero la estructura al día (las migraciones pendientes), y recién
    // después la configuración del servidor: así lo que se acomoda acá es lo
    // último que se escribe y ninguna migración lo pisa. PocketBase vuelve a
    // repasar las migraciones al abrir y ya no encuentra nada pendiente.
    e.app.runAllMigrations();
    require(`${__hooks}/lib_arranque.js`).aplicar(e.app);
  } catch (err) {
    // Nunca frenar el arranque por esto: se anota y el sistema abre igual.
    console.log("[arranque] no se pudo aplicar la configuración del servidor — " + err);
  }
});
