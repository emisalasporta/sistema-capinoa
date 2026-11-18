/// <reference path="../pb_data/types.d.ts" />

/**
 * Aviso por correo de un reporte nuevo.
 *
 * Mismo molde que el sistema DPRD: se manda por Resend (un servicio de envío
 * de correo), sin necesidad de configurar un servidor de mail. Todo sale de
 * variables de entorno de Dokploy:
 *
 *   RESEND_API_KEY     la llave de Resend. Sin ella NO se manda correo: el
 *                      reporte queda guardado y se ve en Configuración.
 *   RESEND_FROM        remitente (tiene que ser de un dominio validado en Resend).
 *   REPORTES_DESTINO   a qué casilla llegan.
 *   CAPINOA_URL        dirección pública del sistema (para adjuntar la captura).
 *
 * La captura viaja ADJUNTA: se arma una dirección temporal con permiso de
 * lectura del archivo y Resend la baja al enviar. El archivo sigue protegido.
 */

const ETIQUETA_TIPO = {
  error: "Algo no funciona",
  duda: "No sé cómo hacer algo",
  mejora: "Una idea para mejorar",
  otro: "Otra cosa",
};

function env(nombre) {
  return String($os.getenv(nombre) || "").trim();
}

function escapar(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function armarHtml(d) {
  const fila = (k, v) =>
    v ? '<tr><td style="padding:2px 12px 2px 0"><b>' + k + "</b></td><td>" + escapar(v) + "</td></tr>" : "";
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#182634;line-height:1.5">' +
    '<h2 style="margin:0 0 4px;color:#12385F">' + escapar(d.titulo) + "</h2>" +
    '<p style="margin:0 0 16px;color:#5b6478;font-size:13px">' + escapar(d.tipo) + "</p>" +
    '<div style="background:#F4F8FB;border:1px solid #dbe5ee;border-radius:10px;padding:14px 16px;margin-bottom:16px">' +
    escapar(d.cuerpo).replace(/\n/g, "<br>") + "</div>" +
    '<table style="font-size:13px;color:#5b6478;border-collapse:collapse">' +
    fila("Reportado por", d.autor) + fila("Pantalla", d.pagina) + "</table>" +
    (d.conCaptura ? '<p style="margin-top:16px;font-size:12px;color:#8b94aa">Captura de pantalla adjunta.</p>' : "") +
    '<hr style="border:none;border-top:1px solid #dbe5ee;margin:20px 0 8px">' +
    '<p style="font-size:11px;color:#8b94aa;margin:0">Enviado automáticamente por el sistema de CAPINOA.</p>' +
    "</div>"
  );
}

function avisar(app, record) {
  if (record.getBool("email_enviado")) return { saltado: "ya-enviado" };

  const llave = env("RESEND_API_KEY");
  const remitente = env("RESEND_FROM");
  const destino = env("REPORTES_DESTINO");
  if (!llave || !remitente || !destino) {
    console.log("[reportes] reporte guardado; el correo no está configurado, no se envía aviso.");
    return { saltado: "sin-correo" };
  }

  const titulo = record.getString("titulo") || "(sin título)";
  const tipo = ETIQUETA_TIPO[record.getString("tipo")] || "Otra cosa";
  const captura = record.getString("captura");

  let autor = "Usuario del sistema";
  let autorRec = null;
  try {
    autorRec = app.findRecordById("equipo", record.getString("autor"));
    autor = autorRec.getString("nombre") || autor;
  } catch (_) {
    autorRec = null;
  }

  // Adjunto: dirección temporal con permiso al archivo protegido.
  const adjuntos = [];
  const base = (env("CAPINOA_URL") || String(app.settings().meta.appURL || "")).replace(/\/+$/, "");
  if (captura && autorRec && base.indexOf("https://") === 0) {
    try {
      const permiso = autorRec.newFileToken();
      adjuntos.push({
        filename: captura,
        path: base + "/api/files/reportes/" + record.id + "/" + encodeURIComponent(captura) + "?token=" + permiso,
      });
    } catch (err) {
      console.log("[reportes] no se pudo preparar el adjunto — " + err);
    }
  }

  const cuerpo = {
    from: remitente,
    to: [destino],
    subject: "[CAPINOA] " + tipo + " — " + titulo,
    html: armarHtml({
      titulo: titulo,
      tipo: tipo,
      cuerpo: record.getString("cuerpo"),
      autor: autor,
      pagina: record.getString("pagina_origen"),
      conCaptura: adjuntos.length > 0,
    }),
  };
  if (adjuntos.length) cuerpo.attachments = adjuntos;

  const resp = $http.send({
    url: "https://api.resend.com/emails",
    method: "POST",
    timeout: 30,
    headers: { Authorization: "Bearer " + llave, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    console.log("[reportes] Resend respondió " + resp.statusCode + ": " + (resp.raw || ""));
    return { ok: false };
  }

  record.set("email_enviado", true);
  app.save(record);
  console.log("[reportes] aviso enviado — " + titulo);
  return { ok: true };
}

module.exports = { avisar };
