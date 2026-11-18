/**
 * Utilidades de interfaz: avisos, formato de fechas y textos, iconos.
 * Todo lo chico y repetido que usan varias pantallas.
 */

/* ---------- Avisos flotantes ---------- */

let contenedorToast: HTMLElement | null = null;

export function aviso(mensaje: string, tipo: "ok" | "error" = "ok"): void {
  if (typeof document === "undefined") return;
  if (!contenedorToast) {
    contenedorToast = document.createElement("div");
    contenedorToast.className = "toast";
    contenedorToast.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5L20 7"/></svg><span></span>`;
    document.body.appendChild(contenedorToast);
  }
  const icono = contenedorToast.querySelector("svg")!;
  icono.innerHTML =
    tipo === "error"
      ? `<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/>`
      : `<path d="M5 12l5 5L20 7"/>`;
  contenedorToast.classList.toggle("error", tipo === "error");
  contenedorToast.querySelector("span")!.textContent = mensaje;
  contenedorToast.classList.add("show");
  window.clearTimeout((contenedorToast as never as { _t: number })._t);
  (contenedorToast as never as { _t: number })._t = window.setTimeout(() => {
    contenedorToast?.classList.remove("show");
  }, 3200);
}

/** Traduce el error de PocketBase a algo que se entienda. */
export function mensajeDeError(e: unknown): string {
  const err = e as { message?: string; response?: { message?: string; data?: Record<string, { message?: string }> } };
  const datos = err?.response?.data;
  if (datos) {
    const campos = Object.entries(datos)
      .map(([campo, det]) => `${campo}: ${det?.message ?? "inválido"}`)
      .filter(Boolean);
    if (campos.length) return campos.join(" · ");
  }
  return err?.response?.message ?? err?.message ?? "Ocurrió un error inesperado.";
}

/* ---------- Enlaces internos ---------- */

/**
 * Arma un enlace interno del sistema. **Usar SIEMPRE esto en vez de escribir la
 * dirección a mano.**
 *
 * ⚠️ El motivo: cuando el sistema lo sirve PocketBase (que es como lo usa
 * Ricardo), pedir `/pacientes/ficha?id=123` provoca una redirección a
 * `/pacientes/ficha/` **que descarta el `?id=123`**. La ficha queda sin saber
 * qué paciente abrir y rebota al listado. Peor todavía: es una redirección
 * "permanente", así que el navegador la recuerda y reintentar no arregla nada.
 *
 * La solución es la barra final ANTES del signo de pregunta:
 * `/pacientes/ficha/?id=123`. Esta función la pone sola.
 */
export function enlace(ruta: string, params?: Record<string, string | undefined>): string {
  let base = ruta.startsWith("/") ? ruta : "/" + ruta;
  if (!base.endsWith("/")) base += "/";

  if (!params) return base;
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") query.set(k, v);
  }
  const texto = query.toString();
  return texto ? `${base}?${texto}` : base;
}

/* ---------- Texto ---------- */

/** Escapa HTML. Obligatorio antes de meter texto del usuario en innerHTML. */
export function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "consulta_inicial" → "Consulta inicial" */
export function legible(valor?: string | null): string {
  if (!valor) return "";
  const t = valor.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function iniciales(apellido?: string, nombre?: string): string {
  const a = (apellido ?? "").trim();
  const n = (nombre ?? "").trim();
  return ((n[0] ?? "") + (a[0] ?? "")).toUpperCase() || "?";
}

/** Color estable derivado del id: el mismo paciente siempre del mismo color. */
const COLORES = ["#1E5C93", "#16A9B8", "#2F6FB0", "#1FA97A", "#D9902B", "#7A5AA8"];
export function colorDe(id: string): string {
  let suma = 0;
  for (let i = 0; i < id.length; i++) suma += id.charCodeAt(i);
  return COLORES[suma % COLORES.length];
}

/* ---------- Fechas ---------- */

/**
 * ⚠️ Las fechas se manejan como TEXTO, nunca convirtiéndolas con `new Date()`.
 *
 * PocketBase guarda "1988-03-14 00:00:00.000Z", o sea medianoche en huso cero.
 * Argentina está tres horas atrás, así que si se convierte a fecha del sistema
 * queda "13/03/1988 21:00" y se muestra UN DÍA ANTES. En fechas de nacimiento,
 * de consulta o de control eso es inaceptable.
 *
 * Como acá una fecha es un día del calendario (no un instante), lo correcto es
 * leer los números tal cual vienen y no tocarlos.
 */

/** Separa "2026-08-18 00:00:00.000Z" en [año, mes, día]. */
function partesDeFecha(v?: string | null): [string, string, string] | null {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? [m[1], m[2], m[3]] : null;
}

/** "2026-08-18 00:00:00.000Z" → "18/08/2026" */
export function fecha(v?: string | null): string {
  const p = partesDeFecha(v);
  return p ? `${p[2]}/${p[1]}/${p[0]}` : "";
}

/** Para poner dentro de un <input type="date"> (formato "2026-08-18"). */
export function fechaInput(v?: string | null): string {
  const p = partesDeFecha(v);
  return p ? `${p[0]}-${p[1]}-${p[2]}` : "";
}

/** Hoy según el reloj de la computadora, no según el huso cero. */
export function hoyInput(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Edad en años a partir de la fecha de nacimiento. */
export function edad(nacimiento?: string | null): number | null {
  const p = partesDeFecha(nacimiento);
  if (!p) return null;
  const [a, m, d] = p.map(Number);
  const hoy = new Date();
  let años = hoy.getFullYear() - a;
  const difMes = hoy.getMonth() + 1 - m;
  if (difMes < 0 || (difMes === 0 && hoy.getDate() < d)) años--;
  return años >= 0 && años < 130 ? años : null;
}

export function montoARS(n: number): string {
  return "$" + Math.abs(n).toLocaleString("es-AR");
}

/* ---------- Fecha + hora (turnos) ---------- */

/**
 * ⚠️ Los turnos guardan la HORA DEL RELOJ DEL CONSULTORIO, sin convertir husos.
 *
 * Un turno no es "un instante en el planeta": es "las tres de la tarde en Prado
 * 444". Todos los que usan el sistema están en el mismo lugar. Si empezáramos a
 * convertir a huso cero y de vuelta, un turno de las 15:00 podría mostrarse
 * 12:00 o 18:00 según la computadora, y en el cambio de horario de verano se
 * correrían todos. Guardando el reloj tal cual, eso no puede pasar nunca.
 *
 * Formato guardado: "2026-08-18 15:00:00.000Z"  →  se lee como 15:00 y punto.
 */

/** "2026-08-18 15:00:00.000Z" → "15:00" */
export function hora(v?: string | null): string {
  if (!v) return "";
  const m = String(v).match(/[ T](\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "";
}

/** Une "2026-08-18" + "15:00" en el formato que guarda la base. */
export function unirFechaHora(dia: string, hhmm: string): string {
  if (!dia) return "";
  const h = hhmm || "00:00";
  return `${dia} ${h}:00.000Z`;
}

/** Suma minutos a una fecha+hora y devuelve el resultado en el mismo formato. */
export function sumarMinutos(dia: string, hhmm: string, minutos: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const [hh, mm] = (hhmm || "00:00").split(":").map(Number);
  // Se usa UTC a propósito: así sumar minutos nunca se ve afectado por el
  // horario de verano ni por la zona de la computadora.
  const t = new Date(Date.UTC(a, m - 1, d, hh, mm) + minutos * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:00.000Z`;
}

/** Suma (o resta) días a una fecha "2026-08-18". */
export function sumarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d + dias));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
}

/** Los 7 días de la semana (lunes a domingo) que contiene la fecha dada. */
export function semanaDe(dia: string): string[] {
  const [a, m, d] = dia.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  // getUTCDay(): 0 = domingo. Queremos que la semana arranque el lunes.
  const desplazamiento = (t.getUTCDay() + 6) % 7;
  const lunes = sumarDias(dia, -desplazamiento);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-08-18" → "Mar" */
export function nombreDia(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  return DIAS_SEMANA[(t.getUTCDay() + 6) % 7];
}

/** "2026-08-18" → "martes 18 de agosto de 2026" */
export function fechaLarga(dia: string): string {
  const p = dia.split("-").map(Number);
  if (p.length !== 3) return "";
  const t = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  const nombres = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  return `${nombres[(t.getUTCDay() + 6) % 7]} ${p[2]} de ${MESES[p[1] - 1]} de ${p[0]}`;
}

/** Rango de filtro para pedirle a la base los turnos de un día. */
export function rangoDelDia(dia: string): string {
  return `inicio >= "${dia} 00:00:00" && inicio <= "${dia} 23:59:59"`;
}

/** Rango de filtro entre dos días (inclusive). */
export function rangoEntre(desde: string, hasta: string): string {
  return `inicio >= "${desde} 00:00:00" && inicio <= "${hasta} 23:59:59"`;
}

/** Suma (o resta) meses. Si el día no existe en el mes destino (31 → febrero),
 *  cae en el último día de ese mes en vez de saltar al mes siguiente. */
export function sumarMeses(dia: string, meses: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const destino = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimoDia = new Date(
    Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${destino.getUTCFullYear()}-${p(destino.getUTCMonth() + 1)}-${p(Math.min(d, ultimoDia))}`;
}

/**
 * Las 6 semanas (42 días) que hacen falta para dibujar el mes completo en una
 * grilla. Arranca el lunes de la semana en la que cae el día 1, así que incluye
 * algunos días del mes anterior y del siguiente: es lo normal en un calendario.
 */
export function mesDe(dia: string): string[] {
  const [a, m] = dia.split("-").map(Number);
  const p = (n: number) => String(n).padStart(2, "0");
  const primero = `${a}-${p(m)}-01`;
  const inicio = semanaDe(primero)[0];
  return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
}

/** "2026-08-18" → "agosto 2026" */
export function nombreMes(dia: string): string {
  const [a, m] = dia.split("-").map(Number);
  return `${MESES[m - 1]} ${a}`;
}

/** ¿Los dos días caen en el mismo mes? (para atenuar los días de relleno) */
export function mismoMes(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/* ---------- Etiquetas de los campos con opciones fijas ---------- */

export const ESTADOS_PACIENTE: Record<string, { texto: string; tono: string }> = {
  consulta_inicial: { texto: "Consulta inicial", tono: "neutral" },
  en_evaluacion: { texto: "En evaluación", tono: "warn" },
  en_tratamiento: { texto: "En tratamiento", tono: "good" },
  candidato_fue: { texto: "Candidato a FUE", tono: "info" },
  programado_cirugia: { texto: "Cirugía programada", tono: "info" },
  post_operatorio: { texto: "Post-operatorio", tono: "info" },
  seguimiento: { texto: "En seguimiento", tono: "good" },
  alta: { texto: "Alta", tono: "neutral" },
  inactivo: { texto: "Inactivo", tono: "neutral" },
};

export const TOMAS: Record<string, string> = {
  frontal: "Frontal",
  superior: "Superior",
  vertex: "Vertex",
  temporal_derecha: "Temporal derecha",
  temporal_izquierda: "Temporal izquierda",
  occipital: "Occipital",
  donante: "Zona donante",
  detalle: "Detalle",
  otra: "Otra",
};

export const MOMENTOS: Record<string, string> = {
  consulta_inicial: "Consulta inicial",
  pre_quirurgica: "Pre-quirúrgica",
  intraoperatorio: "Intraoperatorio",
  dia_7: "Día 7",
  mes_1: "1 mes",
  mes_3: "3 meses",
  mes_6: "6 meses",
  mes_9: "9 meses",
  mes_12: "12 meses",
  mes_18: "18 meses",
  otro: "Otro",
};

/** Orden cronológico de los momentos, para ordenar la galería antes/después. */
export const ORDEN_MOMENTOS = [
  "consulta_inicial",
  "pre_quirurgica",
  "intraoperatorio",
  "dia_7",
  "mes_1",
  "mes_3",
  "mes_6",
  "mes_9",
  "mes_12",
  "mes_18",
  "otro",
];

export const TIPOS_TURNO: Record<string, { texto: string; minutos: number }> = {
  consulta_inicial: { texto: "Consulta inicial", minutos: 45 },
  control: { texto: "Control", minutos: 20 },
  prp: { texto: "PRP", minutos: 40 },
  mesoterapia: { texto: "Mesoterapia capilar", minutos: 30 },
  cirugia_fue: { texto: "Cirugía FUE", minutos: 480 },
  curacion: { texto: "Curación", minutos: 20 },
  otro: { texto: "Otro", minutos: 30 },
};

export const ESTADOS_TURNO: Record<string, { texto: string; tono: string }> = {
  pendiente: { texto: "Por confirmar", tono: "warn" },
  confirmado: { texto: "Confirmado", tono: "good" },
  en_sala: { texto: "En sala", tono: "info" },
  atendido: { texto: "Atendido", tono: "neutral" },
  ausente: { texto: "No vino", tono: "bad" },
  cancelado: { texto: "Cancelado", tono: "neutral" },
};

/** Categorías de los movimientos de dinero, separadas por tipo para que el
 *  formulario ofrezca solo las que corresponden. */
export const CATEGORIAS_INGRESO: Record<string, string> = {
  implante_fue: "Implante FUE",
  sena: "Seña",
  prp: "PRP",
  mesoterapia: "Mesoterapia",
  consulta: "Consulta",
  medicacion: "Medicación",
  otro: "Otro ingreso",
};

export const CATEGORIAS_EGRESO: Record<string, string> = {
  insumos: "Insumos",
  alquiler: "Alquiler",
  sueldos: "Sueldos y honorarios",
  publicidad: "Publicidad",
  impuestos: "Impuestos",
  equipamiento: "Equipamiento",
  medicacion: "Medicación",
  otro: "Otro gasto",
};

export const CATEGORIAS: Record<string, string> = {
  ...CATEGORIAS_INGRESO,
  ...CATEGORIAS_EGRESO,
};

export const MEDIOS_PAGO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
  mercado_pago: "Mercado Pago",
  cheque: "Cheque",
  otro: "Otro",
};

export const TIPOS_EVALUACION: Record<string, string> = {
  consulta_inicial: "Consulta inicial",
  control: "Control",
  pre_quirurgica: "Evaluación pre-quirúrgica",
  post_operatorio: "Control post-operatorio",
  sesion_tratamiento: "Sesión de tratamiento",
};

export const COMO_LLEGO: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  recomendacion: "Recomendación",
  publicidad: "Publicidad",
  paso_por_el_consultorio: "Pasó por el consultorio",
  otro: "Otro",
};

/* ---------- Iconos (SVG en línea, sin librerías) ---------- */

export const ICONO = {
  mas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  volver: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>`,
  guardar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>`,
  deshacer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>`,
  borrar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>`,
  camara: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8.5h3.2l1.6-2.4h8.4l1.6 2.4H21v11H3z"/><circle cx="12" cy="14" r="3.6"/></svg>`,
  subir: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>`,
  lapiz: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>`,
  ojo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="3"/></svg>`,
  alerta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v5M12 16v.5"/><circle cx="12" cy="12" r="9"/></svg>`,
  candado: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  tilde: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>`,
  descargar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 4v12M8 12l4 4 4-4"/><path d="M4 18v1.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V18"/></svg>`,
};
