/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "turnos" — la agenda.
 *
 * Se crea el esquema ahora (es barato y evita migraciones sueltas después),
 * aunque la pantalla de agenda se construye en un paso posterior.
 *
 * `nombre_libre` existe para el caso real de recepción: llama alguien que todavía
 * no es paciente y pide turno para la consulta inicial. Se agenda con el nombre
 * suelto y, cuando viene, se lo convierte en paciente.
 *
 * Permisos: TODO el equipo (incluida recepción) gestiona turnos. Es justamente
 * lo que Ricardo quiere delegar.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");
    const pacientes = app.findCollectionByNameOrId("pacientes");

    const collection = new Collection({
      type: "base",
      name: "turnos",

      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",

      fields: [
        {
          name: "paciente",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: pacientes.id,
          cascadeDelete: false,
        },
        {
          name: "nombre_libre",
          type: "text",
          required: false,
          max: 160,
        },
        {
          name: "telefono_libre",
          type: "text",
          required: false,
          max: 30,
        },
        {
          name: "inicio",
          type: "date",
          required: true,
        },
        {
          name: "fin",
          type: "date",
          required: false,
        },
        {
          name: "tipo",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "consulta_inicial",
            "control",
            "prp",
            "mesoterapia",
            "cirugia_fue",
            "curacion",
            "otro",
          ],
        },
        {
          name: "estado",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "pendiente",
            "confirmado",
            "en_sala",
            "atendido",
            "ausente",
            "cancelado",
          ],
        },
        {
          name: "profesional",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: equipo.id,
          cascadeDelete: false,
        },
        {
          name: "notas",
          type: "text",
          required: false,
          max: 2000,
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
        "CREATE INDEX idx_turnos_inicio ON turnos (inicio)",
        "CREATE INDEX idx_turnos_paciente ON turnos (paciente)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("turnos");
    app.delete(collection);
  }
);
