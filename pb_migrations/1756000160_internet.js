/// <reference path="../pb_data/types.d.ts" />

/**
 * Migración: lo que hace falta para que el sistema viva en internet.
 *
 * Mientras el sistema corría solo en la notebook de la clínica, varias cosas
 * podían quedar flojas porque nadie de afuera llegaba hasta ahí. En internet
 * cualquiera puede probar la puerta, así que se cierran acá:
 *
 * 1) USUARIOS (`equipo`)
 *    · Nadie puede cambiarse a sí mismo el rol ni reactivarse. La regla vieja
 *      dejaba que cada uno editara su propio registro ENTERO (hacía falta para
 *      cambiar la contraseña), y por ahí recepción podía ponerse rol "admin"
 *      llamando al servidor a mano y ver las historias clínicas.
 *    · Campo nuevo `debe_cambiar_clave`: marca las contraseñas provisorias. El
 *      sistema obliga a cambiarla en el primer ingreso (pantalla /cambiar-clave/).
 *      Lo sube y lo baja el servidor (pb_hooks/seguridad.pb.js), nunca la persona.
 *    · Contraseñas de 10 caracteres como mínimo.
 *    · Sin aviso por correo de "nuevo inicio de sesión": no hay correo saliente.
 *
 * 2) REPORTES (`reportes`)
 *    Lo que manda el equipo con el botón "Reportar un problema". La captura es
 *    un archivo PROTEGIDO, igual que las fotos: puede mostrar datos de pacientes.
 *    Cada uno ve solo los suyos; el administrador los ve todos.
 *
 * 3) LÍMITE DE INTENTOS
 *    Tope de pedidos por dirección de origen: pocos intentos de ingreso por
 *    minuto (frena a quien quiera adivinar contraseñas probando miles) y pocos
 *    intentos de activación. Como el sistema queda detrás del proxy del
 *    servidor (Traefik), se le indica de dónde leer la dirección real de quien
 *    se conecta; sin eso todos parecerían la misma persona.
 *
 * Es idempotente: se puede volver a correr sin duplicar nada.
 */
migrate(
  (app) => {
    // ───────── 1) Usuarios ─────────
    const equipo = app.findCollectionByNameOrId("equipo");

    if (!equipo.fields.getByName("debe_cambiar_clave")) {
      equipo.fields.add(new Field({ name: "debe_cambiar_clave", type: "bool" }));
    }

    equipo.updateRule =
      "@request.auth.rol = 'admin' || " +
      "(id = @request.auth.id" +
      " && @request.body.rol:isset = false" +
      " && @request.body.activo:isset = false" +
      " && @request.body.verified:isset = false" +
      " && @request.body.debe_cambiar_clave:isset = false)";

    const clave = equipo.fields.getByName("password");
    if (clave) clave.min = 10;

    equipo.authAlert.enabled = false;
    app.save(equipo);

    // ───────── 2) Reportes ─────────
    let existe = true;
    try {
      app.findCollectionByNameOrId("reportes");
    } catch (_) {
      existe = false;
    }

    if (!existe) {
      const reportes = new Collection({
        type: "base",
        name: "reportes",

        listRule: "@request.auth.rol = 'admin' || autor = @request.auth.id",
        viewRule: "@request.auth.rol = 'admin' || autor = @request.auth.id",
        createRule: "@request.auth.id != '' && autor = @request.auth.id",
        updateRule: "@request.auth.rol = 'admin'",
        deleteRule: "@request.auth.rol = 'admin'",

        fields: [
          { name: "titulo", type: "text", required: true, min: 2, max: 150, presentable: true },
          { name: "cuerpo", type: "text", required: true, max: 5000 },
          {
            name: "tipo",
            type: "select",
            required: false,
            maxSelect: 1,
            values: ["error", "duda", "mejora", "otro"],
          },
          {
            name: "captura",
            type: "file",
            required: false,
            maxSelect: 1,
            maxSize: 10485760, // 10 MB
            mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
            protected: true,
          },
          {
            name: "autor",
            type: "relation",
            required: false,
            maxSelect: 1,
            collectionId: equipo.id,
            cascadeDelete: false,
          },
          { name: "pagina_origen", type: "text", required: false, max: 500 },
          { name: "email_enviado", type: "bool" },
          { name: "resuelto", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],

        indexes: ["CREATE INDEX idx_reportes_autor ON reportes (autor)"],
      });
      app.save(reportes);
    }

    // ───────── 3) Límite de intentos y proxy ─────────
    const settings = app.settings();

    settings.meta.appName = "CAPINOA";

    settings.trustedProxy.headers = ["X-Forwarded-For"];
    settings.trustedProxy.useLeftmostIP = false;

    settings.rateLimits.enabled = true;
    settings.rateLimits.rules = [
      // Ingreso con usuario y contraseña: 8 intentos por minuto.
      { label: "*:authWithPassword", maxRequests: 8, duration: 60, audience: "" },
      // Clave de activación: 5 intentos por minuto.
      { label: "POST /api/capinoa/activar", maxRequests: 5, duration: 60, audience: "" },
      // Altas (pacientes, turnos, fotos, reportes): holgado para el uso normal.
      { label: "*:create", maxRequests: 60, duration: 10, audience: "" },
      // Todo lo demás. Una ficha con muchas fotos hace decenas de pedidos.
      { label: "/api/", maxRequests: 600, duration: 10, audience: "" },
    ];

    app.save(settings);
  },
  (app) => {
    const settings = app.settings();
    settings.rateLimits.enabled = false;
    app.save(settings);

    try {
      app.delete(app.findCollectionByNameOrId("reportes"));
    } catch (_) {
      /* ya no estaba */
    }

    const equipo = app.findCollectionByNameOrId("equipo");
    equipo.updateRule = "@request.auth.rol = 'admin' || id = @request.auth.id";
    app.save(equipo);
  }
);
