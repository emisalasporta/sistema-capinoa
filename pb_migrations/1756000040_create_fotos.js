/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "fotos" — las fotos clínicas reales del paciente.
 *
 * Cada registro = UNA foto sacada al paciente (con el celular, la tablet o la
 * cámara) y subida al sistema. Se clasifica por:
 *   - `toma`    → desde dónde se sacó (frontal, superior, vertex, occipital…).
 *                 Son las 8 tomas estandarizadas de la historia tricológica.
 *   - `momento` → en qué punto del tratamiento (consulta inicial, día 7, mes 3…).
 *
 * Con esas dos etiquetas el sistema puede armar solo la grilla de antes/después:
 * misma toma, distintos momentos, en orden.
 *
 * El archivo se guarda en PocketBase (carpeta pb_data/storage). Se genera
 * miniatura automática para que la galería no tenga que bajar la foto completa.
 *
 * Permisos: cerradas a médico/admin, igual que la historia clínica.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");
    const pacientes = app.findCollectionByNameOrId("pacientes");
    const evaluaciones = app.findCollectionByNameOrId("evaluaciones");

    const soloClinico =
      "@request.auth.rol = 'admin' || @request.auth.rol = 'medico'";

    const collection = new Collection({
      type: "base",
      name: "fotos",

      listRule: soloClinico,
      viewRule: soloClinico,
      createRule: soloClinico,
      updateRule: soloClinico,
      deleteRule: soloClinico,

      fields: [
        {
          name: "paciente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: pacientes.id,
          cascadeDelete: true,
        },
        {
          name: "evaluacion",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: evaluaciones.id,
          cascadeDelete: false,
          // Opcional: se puede sacar una foto suelta sin abrir una evaluación.
        },
        {
          name: "archivo",
          type: "file",
          required: true,
          maxSelect: 1,
          maxSize: 20971520, // 20 MB — fotos de celular actuales entran de sobra
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          thumbs: ["320x240", "800x600"],
        },
        {
          name: "toma",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "frontal",
            "superior",
            "vertex",
            "temporal_derecha",
            "temporal_izquierda",
            "occipital",
            "donante",
            "detalle",
            "otra",
          ],
        },
        {
          name: "momento",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "consulta_inicial",
            "pre_quirurgica",
            "intraoperatorio",
            "dia_7",
            "mes_1",
            "mes_3",
            "mes_6",
            "mes_9",
            "mes_12",
            "mes_18",
            "otro",
          ],
        },
        {
          name: "fecha",
          type: "date",
          required: false,
        },
        {
          name: "notas",
          type: "text",
          required: false,
          max: 1000,
        },
        {
          name: "subido_por",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: equipo.id,
          cascadeDelete: false,
        },
      ],

      indexes: [
        "CREATE INDEX idx_fotos_paciente ON fotos (paciente, fecha)",
        "CREATE INDEX idx_fotos_toma ON fotos (paciente, toma, momento)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("fotos");
    app.delete(collection);
  }
);
