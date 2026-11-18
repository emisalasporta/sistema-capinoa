/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: marca como PROTEGIDOS los archivos de fotos y marcados.
 *
 * Por defecto PocketBase sirve los archivos a cualquiera que tenga la dirección
 * exacta, aunque no esté logueado. Para fotos clínicas de pacientes eso no va.
 *
 * Con `protected: true`, cada foto solo se entrega si el pedido trae un permiso
 * temporal que el servidor le da a quien tiene sesión válida. Recepción, al no
 * poder listar las fotos, tampoco puede pedir ese permiso para ellas.
 *
 * (Se hace en una migración aparte y no editando la original porque una
 * migración ya aplicada no se toca nunca: se agrega una nueva.)
 */
migrate(
  (app) => {
    const proteger = (nombreCollection, nombreCampo) => {
      const collection = app.findCollectionByNameOrId(nombreCollection);
      const campo = collection.fields.getByName(nombreCampo);
      if (campo) {
        campo.protected = true;
        app.save(collection);
      }
    };

    proteger("fotos", "archivo");
    proteger("marcados", "render");
  },
  (app) => {
    const desproteger = (nombreCollection, nombreCampo) => {
      const collection = app.findCollectionByNameOrId(nombreCollection);
      const campo = collection.fields.getByName(nombreCampo);
      if (campo) {
        campo.protected = false;
        app.save(collection);
      }
    };

    desproteger("fotos", "archivo");
    desproteger("marcados", "render");
  }
);
