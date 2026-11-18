/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "pacientes" — la CAPA 1 de la ficha.
 *
 * Solo datos administrativos y de contacto: lo mínimo para dar de alta a alguien
 * en 30 segundos, sin necesidad de que el médico esté presente.
 *
 * Todo lo clínico vive en OTRAS collections ("historias" y "evaluaciones"),
 * justamente para poder darle acceso a recepción acá sin abrirle la historia
 * clínica. Recepción ve y edita pacientes (para agendar y contactar); las
 * historias y las fotos quedan cerradas a médico/admin.
 *
 * `dni` tiene índice único PARCIAL (solo cuando está cargado): permite dar de
 * alta a alguien sin DNI, pero evita duplicar un paciente ya registrado.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");

    const collection = new Collection({
      type: "base",
      name: "pacientes",

      // Todos los usuarios del sistema ven y gestionan pacientes.
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      // Borrar un paciente arrastra su historia y sus fotos: solo admin/médico.
      deleteRule: "@request.auth.rol = 'admin' || @request.auth.rol = 'medico'",

      fields: [
        // ===== IDENTIDAD =====
        {
          name: "apellido",
          type: "text",
          required: true,
          min: 2,
          max: 120,
          presentable: true,
        },
        {
          name: "nombre",
          type: "text",
          required: true,
          min: 2,
          max: 120,
          presentable: true,
        },
        {
          name: "dni",
          type: "text",
          required: false,
          max: 15,
        },
        {
          name: "fecha_nacimiento",
          type: "date",
          required: false,
          // La edad NO se guarda: se calcula. Así nunca queda desactualizada.
        },
        {
          name: "sexo",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["masculino", "femenino", "otro"],
          // Define qué secciones del cuestionario se muestran
          // (historia ginecológica vs. antecedentes hormonales masculinos).
        },

        // ===== CONTACTO =====
        {
          name: "telefono",
          type: "text",
          required: false,
          max: 30,
        },
        {
          name: "email",
          type: "email",
          required: false,
        },
        {
          name: "domicilio",
          type: "text",
          required: false,
          max: 200,
        },
        {
          name: "localidad",
          type: "text",
          required: false,
          max: 120,
        },
        {
          name: "ocupacion",
          type: "text",
          required: false,
          max: 120,
        },

        // ===== ORIGEN / MARKETING =====
        {
          name: "como_llego",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "instagram",
            "facebook",
            "google",
            "recomendacion",
            "publicidad",
            "paso_por_el_consultorio",
            "otro",
          ],
        },
        {
          name: "como_llego_detalle",
          type: "text",
          required: false,
          max: 200,
          // Ej: "lo recomendó Damián Torres".
        },

        // ===== SEGUIMIENTO =====
        {
          name: "estado",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "consulta_inicial",
            "en_evaluacion",
            "en_tratamiento",
            "candidato_fue",
            "programado_cirugia",
            "post_operatorio",
            "seguimiento",
            "alta",
            "inactivo",
          ],
        },
        {
          name: "fecha_primera_consulta",
          type: "date",
          required: false,
        },
        {
          name: "medico",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: equipo.id,
          cascadeDelete: false,
        },
        {
          name: "observaciones",
          type: "text",
          required: false,
          max: 4000,
          // Notas administrativas (NO clínicas): "prefiere que lo llamen a la tarde".
        },

        // ===== TRAZABILIDAD =====
        {
          name: "origen",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["carga_manual", "formulario_online", "importacion"],
          // Prepara la fase 2: el mismo registro puede nacer de un formulario web.
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
        // Único solo cuando hay DNI cargado (permite altas sin DNI).
        "CREATE UNIQUE INDEX idx_pacientes_dni ON pacientes (dni) WHERE dni != ''",
        "CREATE INDEX idx_pacientes_nombre ON pacientes (apellido, nombre)",
        "CREATE INDEX idx_pacientes_estado ON pacientes (estado)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("pacientes");
    app.delete(collection);
  }
);
