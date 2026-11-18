/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: agrega "alergias" a la ficha del paciente.
 *
 * Es un dato que hay que tener a mano antes de una cirugía (anestésicos,
 * antibióticos, látex) y no estaba.
 *
 * ── Además sirve de EJEMPLO de cómo se hace un cambio sin romper nada ──
 * Esta migración se agrega a los pacientes que YA existen: les suma la columna
 * vacía y no toca ni un dato de los que ya estaban cargados. Es exactamente el
 * mecanismo por el que Ricardo puede recibir mejoras sin perder su base.
 */
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("pacientes");

    if (!collection.fields.getByName("alergias")) {
      collection.fields.add(
        new Field({
          name: "alergias",
          type: "text",
          required: false,
          max: 500,
        })
      );
      app.save(collection);
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pacientes");
    const campo = collection.fields.getByName("alergias");
    if (campo) {
      collection.fields.removeById(campo.id);
      app.save(collection);
    }
  }
);
