/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "marcados" — el dibujo SOBRE la foto. (Feature estrella.)
 *
 * ── Decisión de fondo: el dibujo NO se "quema" dentro de la foto ──
 * Guardamos los trazos aparte, como vectores (`trazos`: lista de puntos, color y
 * grosor), y la foto original queda intacta. Esto permite:
 *   - Volver a abrir un marcado de hace 3 meses y seguir editándolo o corregirlo.
 *   - Mostrar/ocultar el dibujo para comparar contra la foto limpia.
 *   - Tener varios marcados de la MISMA foto (ej. dos propuestas de línea frontal).
 *   - No perder calidad ni arruinar la foto clínica original.
 *
 * Además guardamos `render`: un PNG con la foto y el dibujo ya combinados. Sirve
 * para mostrarlo rápido en la galería, imprimirlo o mandárselo al paciente, sin
 * tener que redibujar nada.
 *
 * `paciente` está duplicado a propósito (ya se puede llegar por la foto): permite
 * listar todos los marcados de un paciente con una sola consulta.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");
    const pacientes = app.findCollectionByNameOrId("pacientes");
    const fotos = app.findCollectionByNameOrId("fotos");

    const soloClinico =
      "@request.auth.rol = 'admin' || @request.auth.rol = 'medico'";

    const collection = new Collection({
      type: "base",
      name: "marcados",

      listRule: soloClinico,
      viewRule: soloClinico,
      createRule: soloClinico,
      updateRule: soloClinico,
      deleteRule: soloClinico,

      fields: [
        {
          name: "foto",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: fotos.id,
          cascadeDelete: true, // si se borra la foto, el marcado no tiene sentido
        },
        {
          name: "paciente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: pacientes.id,
          cascadeDelete: true,
        },
        {
          name: "titulo",
          type: "text",
          required: false,
          max: 160,
          // Ej: "Propuesta de línea frontal — 14/08".
        },
        {
          name: "trazos",
          type: "json",
          required: false,
          maxSize: 5000000, // 5 MB de puntos: muchísimos trazos
          // Formato: [{ color, grosor, capa, puntos: [[x,y], …] }, …]
          // Las coordenadas van de 0 a 1 (relativas), así el dibujo se
          // reescala solo en cualquier pantalla o al imprimir.
        },
        {
          name: "render",
          type: "file",
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ["image/png", "image/jpeg"],
          thumbs: ["320x240", "800x600"],
        },
        {
          name: "fecha",
          type: "date",
          required: false,
        },
        {
          name: "creado_por",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: equipo.id,
          cascadeDelete: false,
        },
      ],

      indexes: [
        "CREATE INDEX idx_marcados_paciente ON marcados (paciente, fecha)",
        "CREATE INDEX idx_marcados_foto ON marcados (foto)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("marcados");
    app.delete(collection);
  }
);
