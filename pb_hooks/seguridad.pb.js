/// <reference path="../pb_data/types.d.ts" />

/**
 * Contraseñas provisorias.
 *
 * Regla: una contraseña que NO eligió la propia persona es provisoria, y el
 * sistema obliga a cambiarla en el primer ingreso (pantalla /cambiar-clave/).
 *
 *   · Usuario nuevo creado por el administrador        → provisoria.
 *   · El administrador (o el soporte desde el panel
 *     técnico) le pone una contraseña a otra persona   → provisoria.
 *   · La persona cambia SU PROPIA contraseña            → deja de ser provisoria.
 *
 * La marca `debe_cambiar_clave` se decide acá, en el servidor. La regla de la
 * collection no deja que nadie se la baje a mano desde el navegador.
 */

onRecordCreateRequest((e) => {
  e.record.set("debe_cambiar_clave", true);
  e.next();
}, "equipo");

onRecordUpdateRequest((e) => {
  let cuerpo = {};
  try {
    cuerpo = e.requestInfo().body || {};
  } catch (_) {
    cuerpo = {};
  }

  if (cuerpo.password) {
    const quien = e.auth;
    const esPropia =
      !!quien && quien.collection().name === "equipo" && quien.id === e.record.id;
    e.record.set("debe_cambiar_clave", !esPropia);
  }

  e.next();
}, "equipo");
