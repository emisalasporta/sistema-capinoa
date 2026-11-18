/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: crea los DOS usuarios iniciales para poder entrar la primera vez.
 *
 *   ricardo@capinoa.com.ar    → rol médico (ve todo lo clínico)
 *   recepcion@capinoa.com.ar  → rol recepción (sin historias ni fotos)
 *
 * ⚠️  Nacen con una contraseña AL AZAR que nadie conoce. El repositorio es
 * público: acá no puede haber ninguna contraseña escrita. Para poder entrar
 * hay que ponerles una con `herramientas/claves-nuevas.command` (o desde el
 * panel técnico).
 *
 * Solo corre si la collection está vacía: si ya hay usuarios cargados, no toca
 * nada (así se puede reaplicar sin pisar datos reales).
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");

    // ¿Ya hay alguien? Entonces no hacemos nada.
    const existentes = app.findRecordsByFilter("equipo", "id != ''", "", 1, 0);
    if (existentes.length > 0) return;

    const iniciales = [
      {
        email: "ricardo@capinoa.com.ar",
        nombre: "Dr. Ricardo Molina",
        rol: "medico",
      },
      {
        email: "recepcion@capinoa.com.ar",
        nombre: "Recepción",
        rol: "recepcion",
      },
    ];

    for (const datos of iniciales) {
      const usuario = new Record(equipo);
      usuario.set("email", datos.email);
      usuario.set("emailVisibility", true);
      usuario.set("verified", true);
      usuario.set("nombre", datos.nombre);
      usuario.set("rol", datos.rol);
      usuario.set("activo", true);
      usuario.setRandomPassword();
      app.save(usuario);
    }
  },
  (app) => {
    // Al revertir, borramos solo los usuarios semilla (por email).
    for (const email of ["ricardo@capinoa.com.ar", "recepcion@capinoa.com.ar"]) {
      try {
        const r = app.findFirstRecordByData("equipo", "email", email);
        app.delete(r);
      } catch (_) {
        // no existe: nada que borrar
      }
    }
  }
);
