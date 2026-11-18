/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: agrega los campos automáticos `created` y `updated` a todas las
 * collections.
 *
 * Por qué hace falta: hasta versiones viejas de PocketBase estos dos campos se
 * agregaban solos a cualquier collection nueva. Desde la 0.23 en adelante hay
 * que declararlos a mano. Sin ellos, cualquier consulta que ordene por fecha de
 * alta (el panel, "últimos pacientes", el orden de las fotos) devuelve error.
 *
 * `autodate` significa que los completa el propio servidor:
 *   created → se escribe una sola vez, al crear el registro.
 *   updated → se reescribe en cada modificación.
 *
 * Es idempotente: si el campo ya existe, no lo toca.
 */
migrate(
  (app) => {
    const collections = [
      "equipo",
      "pacientes",
      "historias",
      "evaluaciones",
      "fotos",
      "marcados",
      "turnos",
      "movimientos",
    ];

    for (const nombre of collections) {
      const collection = app.findCollectionByNameOrId(nombre);
      let cambio = false;

      if (!collection.fields.getByName("created")) {
        collection.fields.add(
          new Field({
            name: "created",
            type: "autodate",
            onCreate: true,
            onUpdate: false,
          })
        );
        cambio = true;
      }

      if (!collection.fields.getByName("updated")) {
        collection.fields.add(
          new Field({
            name: "updated",
            type: "autodate",
            onCreate: true,
            onUpdate: true,
          })
        );
        cambio = true;
      }

      if (cambio) app.save(collection);
    }
  },
  (app) => {
    // No se revierte: quitar estos campos borraría el historial de fechas.
  }
);
