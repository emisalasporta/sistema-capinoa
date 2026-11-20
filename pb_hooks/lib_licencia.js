/// <reference path="../pb_data/types.d.ts" />

/**
 * Licencia de CAPINOA.
 *
 * Desde el 20/11/2026 el sistema está activado para siempre: no hay período de
 * prueba ni clave de activación. `estado()` devuelve siempre "activado", sin
 * mirar el registro de la collection `licencia`. Así, aunque una mudanza de
 * datos traiga ese registro sin activar, nadie queda afuera.
 *
 * La collection `licencia` se conserva (no se borra ni se toca) para no
 * meterse con los datos de la clínica.
 *
 * ⚠️ Este archivo se carga con `require()` DESDE ADENTRO de cada hook, nunca
 * desde el nivel superior de un `.pb.js`.
 */

/** Estado de la licencia: siempre activado. */
function estado() {
  return { ok: true, activado: true, bloqueado: false };
}

module.exports = { estado };
