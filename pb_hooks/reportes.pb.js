/// <reference path="../pb_data/types.d.ts" />

/**
 * Reportes del equipo ("Reportar un problema").
 *
 * Cuando se crea un reporte, se le avisa por correo a Emiliano con la captura
 * adjunta. La lógica vive en lib_reportes.js.
 *
 * El aviso va en try/catch: si el correo falla o no está configurado, el
 * reporte igual quedó guardado y se ve en Configuración → Problemas reportados.
 */
onRecordAfterCreateSuccess((e) => {
  try {
    require(`${__hooks}/lib_reportes.js`).avisar(e.app, e.record);
  } catch (err) {
    console.log("[reportes] no se pudo avisar por correo — " + err);
  }
  e.next();
}, "reportes");
