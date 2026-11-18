/// <reference path="../pb_data/types.d.ts" />

/**
 * Lógica del período de prueba de CAPINOA.
 *
 * ⚠️ Este archivo se carga con `require()` DESDE ADENTRO de cada hook, nunca
 * desde el nivel superior de un `.pb.js`. Es una limitación del motor de
 * JavaScript que usa PocketBase: las funciones declaradas arriba de todo en un
 * `.pb.js` no existen cuando el hook se ejecuta más tarde.
 */

/** Fecha de hoy según el reloj de la computadora, como "2026-08-18". */
function hoy() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

/** Cuántos días hay entre dos fechas "YYYY-MM-DD". */
function diasEntre(desde, hasta) {
  if (!desde || !hasta) return 0;
  const a = desde.split("-").map(Number);
  const b = hasta.split("-").map(Number);
  const t1 = Date.UTC(a[0], a[1] - 1, a[2]);
  const t2 = Date.UTC(b[0], b[1] - 1, b[2]);
  return Math.floor((t2 - t1) / 86400000);
}

/** El registro único de licencia. */
function registro(app) {
  const encontrados = app.findRecordsByFilter("licencia", "id != ''", "", 1, 0);
  return encontrados.length ? encontrados[0] : null;
}

/**
 * Estado actual de la licencia.
 *
 * `fecha` es la más adelantada entre el reloj de hoy y la última fecha que el
 * sistema vio alguna vez. Así, atrasar el reloj de la computadora para estirar
 * la prueba no sirve de nada: el sistema ya vio esa fecha y no retrocede.
 */
function estado(app) {
  const r = registro(app);
  if (!r) {
    // Sin registro no bloqueamos nada: preferimos que el sistema funcione
    // antes que dejar a alguien afuera por un problema nuestro.
    return { ok: true, activado: true, bloqueado: false, diasRestantes: 9999, sinRegistro: true };
  }

  const activado = r.getBool("activado");
  const dias = r.getInt("dias_prueba") || 15;
  const instalado = r.getString("instalado");
  const vista = r.getString("ultima_vista");
  const ahora = hoy();
  const fecha = vista && vista > ahora ? vista : ahora;

  if (activado) {
    return { ok: true, activado: true, bloqueado: false, diasRestantes: 9999, diasPrueba: dias };
  }

  if (!instalado) {
    // Todavía no arrancó: la prueba empieza en el primer ingreso.
    return { ok: true, activado: false, bloqueado: false, diasRestantes: dias, diasPrueba: dias, instalado: "" };
  }

  const usados = diasEntre(instalado, fecha);
  const restantes = dias - usados;
  return {
    ok: true,
    activado: false,
    bloqueado: restantes <= 0,
    diasRestantes: restantes > 0 ? restantes : 0,
    diasPrueba: dias,
    instalado: instalado,
  };
}

/**
 * Deja constancia de que el sistema se usó hoy.
 * Si es la primera vez, arranca el conteo de la prueba.
 */
function registrarUso(app) {
  const r = registro(app);
  if (!r) return;
  const ahora = hoy();
  let cambio = false;

  if (!r.getString("instalado")) {
    r.set("instalado", ahora);
    cambio = true;
  }
  const vista = r.getString("ultima_vista");
  if (!vista || ahora > vista) {
    r.set("ultima_vista", ahora);
    cambio = true;
  }
  if (cambio) app.save(r);
}

/**
 * Activa el sistema si la clave es correcta.
 *
 * Acá NO está la clave: está su huella digital (sha256). De la huella no se
 * puede volver a la clave, así que tener este archivo no alcanza para activar.
 */
function activar(app, clave) {
  const HUELLA = "eadef6e39d37754358de9a938974a742443f7ecdd7417b6ee31d3a5cef0780e8";

  const limpia = String(clave || "").trim().toUpperCase();
  if (!limpia) return { ok: false, mensaje: "Escribí la clave de activación." };
  if ($security.sha256(limpia) !== HUELLA) {
    return { ok: false, mensaje: "La clave no es correcta." };
  }

  const r = registro(app);
  if (!r) return { ok: false, mensaje: "No se encontró la licencia del sistema." };

  r.set("activado", true);
  r.set("activado_el", hoy());
  app.save(r);
  return { ok: true, mensaje: "Sistema activado. ¡Gracias!" };
}

module.exports = { hoy, diasEntre, estado, registrarUso, activar };
