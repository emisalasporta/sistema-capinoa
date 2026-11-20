/// <reference path="../pb_data/types.d.ts" />

/**
 * Licencia de CAPINOA.
 *
 * El sistema está activado para siempre (ver `lib_licencia.js`): ya no se
 * bloquea el ingreso ni se pide clave. Solo queda la consulta del estado, que
 * siempre contesta "activado".
 */

/** Estado de la licencia. */
routerAdd("GET", "/api/capinoa/licencia", (e) => {
  const lic = require(`${__hooks}/lib_licencia.js`);
  const s = lic.estado();
  return e.json(200, { activado: s.activado, bloqueado: s.bloqueado });
});
