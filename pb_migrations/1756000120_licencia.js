/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "licencia" — el período de prueba.
 *
 * Un solo registro que guarda desde cuándo se está usando el sistema y si ya
 * está activado. La lógica vive en `pb_hooks/lib_licencia.js`.
 *
 * ── Por qué esto vive en el SERVIDOR y no en las pantallas ──
 * Si el bloqueo estuviera en el navegador, se saltea borrando datos del
 * navegador o abriendo otro. Acá lo controla PocketBase: sin licencia vigente
 * no deja iniciar sesión, y sin sesión no hay acceso a ningún dato.
 *
 * Permisos: TODAS las reglas en null. Eso significa que nadie puede leerla ni
 * escribirla desde la API, ni siquiera Ricardo estando logueado. Solo la tocan
 * los hooks del servidor (que corren por encima de las reglas) y el panel
 * técnico de PocketBase.
 */
migrate(
  (app) => {
    const collection = new Collection({
      type: "base",
      name: "licencia",

      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,

      fields: [
        {
          name: "instalado",
          type: "text",
          required: false,
          max: 10,
          // "2026-08-18". Se escribe solo, la primera vez que alguien entra.
        },
        {
          name: "ultima_vista",
          type: "text",
          required: false,
          max: 10,
          // La fecha más adelantada que vio el sistema alguna vez. Sirve para
          // que atrasar el reloj de la computadora no estire la prueba.
        },
        {
          name: "dias_prueba",
          type: "number",
          required: false,
          min: 0,
          onlyInt: true,
        },
        {
          name: "activado",
          type: "bool",
        },
        {
          name: "activado_el",
          type: "text",
          required: false,
          max: 10,
        },
        {
          name: "created",
          type: "autodate",
          onCreate: true,
          onUpdate: false,
        },
        {
          name: "updated",
          type: "autodate",
          onCreate: true,
          onUpdate: true,
        },
      ],
    });

    app.save(collection);

    // El registro único, todavía sin fecha de instalación: la prueba arranca
    // recién cuando alguien entra por primera vez, no cuando se copia la carpeta.
    const registro = new Record(collection);
    registro.set("dias_prueba", 15);
    registro.set("activado", false);
    app.save(registro);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("licencia");
    app.delete(collection);
  }
);
