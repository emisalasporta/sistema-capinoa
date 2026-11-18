/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection AUTH "equipo" — los usuarios del sistema.
 *
 * Cada registro es a la vez la persona y el usuario que se loguea.
 * PocketBase agrega solo: id, email, emailVisibility, verified, password,
 * tokenKey, created, updated.
 *
 * Roles:
 *   - admin      → Emiliano (soporte). Ve y configura todo.
 *   - medico     → Ricardo y futuros profesionales. Ve historias clínicas y fotos.
 *   - recepcion  → secretaría. Gestiona pacientes, turnos y contactos, pero
 *                  NO accede a historias clínicas ni a fotos (regla del cliente).
 *
 * authRule: "activo = true" (a propósito NO pedimos verified=true: en la fase
 * local no hay servidor de mail, así que exigir verificación dejaría a todos
 * afuera. Cuando pasemos a la nube y haya SMTP, se endurece).
 */
migrate(
  (app) => {
    const collection = new Collection({
      type: "auth",
      name: "equipo",

      // Cualquier usuario logueado puede ver al resto (para mostrar "atendido por…").
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      // El alta/baja/edición de usuarios la hace el admin desde el sistema.
      createRule: "@request.auth.rol = 'admin'",
      updateRule: "@request.auth.rol = 'admin' || id = @request.auth.id",
      deleteRule: "@request.auth.rol = 'admin'",

      authRule: "activo = true",
      manageRule: "@request.auth.rol = 'admin'",

      fields: [
        {
          name: "nombre",
          type: "text",
          required: true,
          min: 2,
          max: 120,
          presentable: true,
        },
        {
          name: "rol",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["admin", "medico", "recepcion"],
        },
        {
          name: "matricula",
          type: "text",
          required: false,
          max: 40,
          // Matrícula profesional — se imprime en informes y consentimientos.
        },
        {
          name: "telefono",
          type: "text",
          required: false,
          max: 30,
        },
        {
          name: "activo",
          type: "bool",
        },
      ],

      indexes: [
        "CREATE INDEX idx_equipo_rol ON equipo (rol)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("equipo");
    app.delete(collection);
  }
);
