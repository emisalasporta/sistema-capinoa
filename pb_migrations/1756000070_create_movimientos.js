/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: collection "movimientos" — ingresos y gastos.
 *
 * Igual que turnos: esquema ahora, pantalla después.
 *
 * `monto` se guarda SIEMPRE positivo y el signo lo da `tipo` (ingreso/egreso).
 * Guardar negativos es la forma clásica de terminar con totales mal sumados.
 *
 * Permisos: solo admin y médico. La plata no la ve recepción salvo que Ricardo
 * lo pida expresamente más adelante.
 */
migrate(
  (app) => {
    const equipo = app.findCollectionByNameOrId("equipo");
    const pacientes = app.findCollectionByNameOrId("pacientes");

    const soloDireccion =
      "@request.auth.rol = 'admin' || @request.auth.rol = 'medico'";

    const collection = new Collection({
      type: "base",
      name: "movimientos",

      listRule: soloDireccion,
      viewRule: soloDireccion,
      createRule: soloDireccion,
      updateRule: soloDireccion,
      deleteRule: soloDireccion,

      fields: [
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
          values: ["ingreso", "egreso"],
        },
        {
          name: "concepto",
          type: "text",
          required: true,
          max: 200,
        },
        {
          name: "monto",
          type: "number",
          required: true,
          min: 0,
        },
        {
          name: "categoria",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "implante_fue",
            "sena",
            "prp",
            "mesoterapia",
            "consulta",
            "medicacion",
            "insumos",
            "alquiler",
            "sueldos",
            "publicidad",
            "impuestos",
            "equipamiento",
            "otro",
          ],
        },
        {
          name: "medio_pago",
          type: "select",
          required: false,
          maxSelect: 1,
          values: [
            "efectivo",
            "transferencia",
            "debito",
            "credito",
            "mercado_pago",
            "cheque",
            "otro",
          ],
        },
        {
          name: "paciente",
          type: "relation",
          required: false,
          maxSelect: 1,
          collectionId: pacientes.id,
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
        "CREATE INDEX idx_movimientos_fecha ON movimientos (fecha)",
        "CREATE INDEX idx_movimientos_paciente ON movimientos (paciente)",
      ],
    });

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("movimientos");
    app.delete(collection);
  }
);
