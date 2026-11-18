/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "evaluaciones" — la CAPA 3 de la ficha.
 *
 * Lo que SOLO escribe el médico, y que se repite en el tiempo: examen físico,
 * tricoscopía, escalas, zona donante, diagnóstico, plan e impresión médica.
 * Hay una por encuentro (consulta inicial, control 1 mes, control 3 meses…),
 * así queda la evolución real del paciente y no una foto fija.
 *
 * Mismo criterio que "historias": el grueso va en `datos` (json) para poder
 * cambiar el formulario sin tocar la base. Pero los campos que se usan para
 * BUSCAR, FILTRAR o mostrar en la lista (fecha, tipo, diagnóstico, escalas,
 * candidato a FUE, próximo control) sí son columnas reales e indexables.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");
    const pacientes = app.findCollectionByNameOrId("pacientes");

    const soloClinico =
      "@request.auth.rol = 'admin' || @request.auth.rol = 'medico'";

    const collection = new Collection({
      type: "base",
      name: "evaluaciones",

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
          name: "fecha",
          type: "date",
          required: true,
        },
        {
          name: "tipo",
          type: "select",
          required: true,
          maxSelect: 1,
          values: [
            "consulta_inicial",
            "control",
            "pre_quirurgica",
            "post_operatorio",
            "sesion_tratamiento",
          ],
        },

        // ===== Campos "fuertes": se listan, se filtran, se muestran arriba =====
        {
          name: "diagnostico_principal",
          type: "text",
          required: false,
          max: 200,
        },
        {
          name: "norwood",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["I", "II", "III", "III vertex", "IV", "V", "VI", "VII"],
        },
        {
          name: "ludwig",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["I", "II", "III"],
        },
        {
          name: "sinclair",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["1", "2", "3", "4", "5"],
        },
        {
          name: "candidato_fue",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["si", "no", "pendiente", "requiere_tratamiento_previo"],
        },
        {
          name: "uf_estimadas",
          type: "number",
          required: false,
          min: 0,
          max: 10000,
          onlyInt: true,
          // Estimación, nunca una promesa. La UI lo aclara.
        },
        {
          name: "impresion",
          type: "text",
          required: false,
          max: 8000,
          // "IMPRESIÓN DIAGNÓSTICA / CONCLUSIÓN MÉDICA" — el campo grande.
        },
        {
          name: "proximo_control",
          type: "date",
          required: false,
        },

        // ===== El resto del formulario médico =====
        {
          name: "datos",
          type: "json",
          required: false,
          maxSize: 2000000,
        },

        {
          name: "profesional",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: equipo.id,
          cascadeDelete: false,
        },
      ],

      indexes: [
        "CREATE INDEX idx_evaluaciones_paciente ON evaluaciones (paciente, fecha)",
        "CREATE INDEX idx_evaluaciones_proximo ON evaluaciones (proximo_control)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("evaluaciones");
    app.delete(collection);
  }
);
