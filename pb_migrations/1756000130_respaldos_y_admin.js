/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: respaldos automáticos + usuario de soporte.
 *
 * 1) RESPALDOS AUTOMÁTICOS
 *    Todos los días a las 3 de la mañana, PocketBase se hace una copia completa
 *    de la base y las fotos, y conserva las últimas 7. Quedan dentro de
 *    `pb_data/backups`.
 *
 *    Ojo con qué protege y qué no: sirve para "borré un paciente sin querer" o
 *    "se me arruinó algo el martes". NO protege contra que se rompa el disco de
 *    la notebook, porque están en el mismo disco. Para eso está `respaldar.bat`,
 *    que copia todo a un pendrive o a la nube.
 *
 * 2) USUARIO DE SOPORTE (Emiliano, rol "admin")
 *    Hace falta para dos cosas: administrar usuarios desde el sistema y —
 *    importante — poder entrar aunque el período de prueba esté vencido, que es
 *    justo cuando hay que activarlo.
 */
migrate(
  (app) => {
    // ---- Respaldos automáticos ----
    const settings = app.settings();
    settings.backups.cron = "0 3 * * *"; // todos los días a las 03:00
    settings.backups.cronMaxKeep = 7; // conserva la última semana
    app.save(settings);

    // ---- Usuario de soporte ----
    let existe = false;
    try {
      app.findFirstRecordByData("equipo", "email", "soporte@capinoa.com.ar");
      existe = true;
    } catch (_) {
      existe = false;
    }

    if (!existe) {
      const equipo = app.findCollectionByNameOrId("equipo");
      const soporte = new Record(equipo);
      soporte.set("email", "soporte@capinoa.com.ar");
      soporte.set("emailVisibility", true);
      soporte.set("verified", true);
      soporte.set("nombre", "Soporte");
      soporte.set("rol", "admin");
      soporte.set("activo", true);
      // Contraseña al azar: el repositorio es público y acá no va ninguna
      // escrita. Se le pone una con herramientas/claves-nuevas.command.
      soporte.setRandomPassword();
      app.save(soporte);
    }
  },
  (app) => {
    const settings = app.settings();
    settings.backups.cron = "";
    app.save(settings);
  }
);
