/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: el dueño de la clínica pasa de "medico" a "admin".
 *
 * El alta inicial (1756000080) lo dejó como médico y reservó "admin" para el
 * soporte técnico. Estaba al revés: la clínica es de Ricardo, y él tiene que
 * poder manejar a su propia gente sin depender de nadie.
 *
 * Lo único que cambia en la práctica es que le aparece la sección "Usuarios"
 * en Configuración (dar de alta y de baja al equipo) y que puede borrar
 * historias clínicas.
 *
 * En la base de la clínica esto ya está aplicado. Acá queda la versión para
 * una instalación nueva, que busca al usuario por el correo con el que nace
 * (el repositorio es público: no lleva escrito el correo personal de nadie).
 *
 * Es idempotente: si ya es admin, no hace nada.
 */
migrate(
  (app) => {
    try {
      const usuario = app.findFirstRecordByData("equipo", "email", "ricardo@capinoa.com.ar");
      if (usuario.getString("rol") !== "admin") {
        usuario.set("rol", "admin");
        app.save(usuario);
      }
    } catch (_) {
      // No está cargado con ese correo: nada que hacer.
    }
  },
  (app) => {
    try {
      const usuario = app.findFirstRecordByData("equipo", "email", "ricardo@capinoa.com.ar");
      usuario.set("rol", "medico");
      app.save(usuario);
    } catch (_) {
      /* nada que revertir */
    }
  }
);
