/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "historias" — la CAPA 2 de la ficha (la anamnesis).
 *
 * Es la historia clínica tricológica: todo lo que el PACIENTE puede contestar
 * sobre sí mismo (motivo, historia de la caída, antecedentes, medicación,
 * hábitos, expectativas). Una sola historia por paciente, que se va editando.
 *
 * ── Por qué las respuestas van en un campo `json` y no en 200 columnas ──
 * El cuestionario tiene ~200 preguntas y Ricardo va a querer agregar, sacar y
 * reordenar preguntas a medida que use el sistema. Si cada pregunta fuera una
 * columna, cada cambio sería una migración de base de datos y una edición de
 * pantalla. Con un campo JSON, el cuestionario vive en UN archivo de texto
 * (web/src/lib/cuestionario.ts): agregar una pregunta es agregar una línea, y
 * la pantalla se dibuja sola. Cero migraciones, cero rearmado.
 *
 * Las respuestas se guardan como { id_de_pregunta: valor }.
 *
 * Permisos: cerrada a médico/admin. Recepción NO entra acá.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");
    const pacientes = app.findCollectionByNameOrId("pacientes");

    const soloClinico =
      "@request.auth.rol = 'admin' || @request.auth.rol = 'medico'";

    const collection = new Collection({
      type: "base",
      name: "historias",

      listRule: soloClinico,
      viewRule: soloClinico,
      createRule: soloClinico,
      updateRule: soloClinico,
      deleteRule: "@request.auth.rol = 'admin'",

      fields: [
        {
          name: "paciente",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: pacientes.id,
          cascadeDelete: true, // si se borra el paciente, se borra su historia
        },
        {
          name: "respuestas",
          type: "json",
          required: false,
          maxSize: 2000000, // 2 MB — sobra para texto
        },
        {
          name: "completado_por",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["medico", "recepcion", "paciente"],
          // Cuando exista el formulario online, las que llegue el paciente
          // quedan marcadas como tal y el médico las revisa.
        },
        {
          name: "estado",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["borrador", "completa", "revisada"],
        },
        {
          name: "actualizado_por",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: equipo.id,
          cascadeDelete: false,
        },
      ],

      indexes: [
        // Una sola historia por paciente.
        "CREATE UNIQUE INDEX idx_historias_paciente ON historias (paciente)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("historias");
    app.delete(collection);
  }
);
