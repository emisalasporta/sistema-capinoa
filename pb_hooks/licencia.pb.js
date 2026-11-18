/// <reference path="../pb_data/types.d.ts" />

/**
 * Período de prueba de CAPINOA.
 *
 *   · Bloquea el ingreso cuando se terminaron los días de prueba.
 *   · Informa cuántos días quedan (para el aviso arriba de la pantalla).
 *   · Recibe la clave de activación.
 *
 * La lógica está en `lib_licencia.js`, que se carga con require() DENTRO de
 * cada función: las funciones sueltas de un `.pb.js` no están disponibles
 * cuando el hook corre.
 */

/**
 * Al iniciar sesión (y en cada renovación de sesión).
 *
 * El rol "admin" nunca se bloquea: es la cuenta de soporte, y tiene que poder
 * entrar justamente para activar el sistema o revisar un problema.
 */
onRecordAuthRequest((e) => {
  try {
    const lic = require(`${__hooks}/lib_licencia.js`);
    const rol = e.record.getString("rol");

    if (rol !== "admin") {
      const s = lic.estado($app);
      if (s.bloqueado) {
        throw new ForbiddenError(
          "El período de prueba de CAPINOA terminó. Comunicate con Emiliano para activar el sistema. Tus datos están intactos.",
          null
        );
      }
    }

    lic.registrarUso($app);
  } catch (err) {
    // Si es nuestro bloqueo, se propaga. Cualquier otro problema (por ejemplo
    // que falte la collection) NO puede dejar a nadie afuera del sistema.
    if (err && err.status === 403) throw err;
  }

  e.next();
}, "equipo");

/** Estado de la licencia, para mostrar el aviso de días restantes. */
routerAdd("GET", "/api/capinoa/licencia", (e) => {
  const lic = require(`${__hooks}/lib_licencia.js`);
  try {
    const s = lic.estado($app);
    return e.json(200, {
      activado: s.activado,
      bloqueado: s.bloqueado,
      dias_restantes: s.diasRestantes,
      dias_prueba: s.diasPrueba || 15,
    });
  } catch (err) {
    return e.json(200, { activado: true, bloqueado: false, dias_restantes: 9999 });
  }
});

/** Activación con la clave. */
routerAdd("POST", "/api/capinoa/activar", (e) => {
  const lic = require(`${__hooks}/lib_licencia.js`);
  let cuerpo = {};
  try {
    cuerpo = e.requestInfo().body || {};
  } catch (err) {
    cuerpo = {};
  }

  const r = lic.activar($app, cuerpo.clave);
  return e.json(r.ok ? 200 : 400, r);
});
