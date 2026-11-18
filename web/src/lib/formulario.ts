/**
 * ============================================================================
 *  GENERADOR DE FORMULARIOS
 * ============================================================================
 *
 * Convierte las secciones definidas en `cuestionario.ts` en pantalla, y después
 * vuelve a leer lo que se cargó. Ninguna pantalla escribe el formulario a mano.
 *
 * Es la pieza que hace que agregar una pregunta cueste una línea: se agrega en
 * cuestionario.ts y este archivo la dibuja, la guarda y la lee sin cambios.
 *
 * ── Cómo se guarda cada tipo de respuesta ──
 *   texto / texto_largo / numero / fecha / opcion → "texto"
 *   si_no                                        → "si" | "no" | ""
 *   si_no_detalle                                → { valor: "si"|"no"|"", detalle: "…" }
 *   multiple                                     → ["opción 1", "opción 2"]
 *
 * Ese formato es el que después lee `alertas()` para las banderas rojas.
 */

import type { Pregunta, Seccion } from "./cuestionario";
import { progresoSeccion, tieneRespuesta } from "./cuestionario";
import { esc, ICONO } from "./ui";

export type Respuestas = Record<string, unknown>;

/* ═══════════════════════════ DIBUJAR ═══════════════════════════ */

/** Una sección completa, como acordeón desplegable. */
export function dibujarSeccion(
  seccion: Seccion,
  respuestas: Respuestas,
  opciones: { abierta?: boolean; soloLectura?: boolean } = {}
): string {
  const { contestadas, total } = progresoSeccion(seccion, respuestas);
  const completa = contestadas === total && total > 0;
  const abierta = opciones.abierta ?? contestadas === 0;

  const etiquetaQuien =
    seccion.quien === "paciente"
      ? `<span class="quien-tag paciente" title="Estas preguntas las puede contestar el propio paciente">Lo contesta el paciente</span>`
      : `<span class="quien-tag medico" title="Solo lo completa el profesional">Lo completa el médico</span>`;

  const campos = seccion.preguntas
    .map((p) => dibujarPregunta(p, respuestas?.[p.id], opciones.soloLectura))
    .join("");

  return `
    <details class="seccion" data-seccion="${esc(seccion.id)}"${abierta ? " open" : ""}>
      <summary>
        <span>${esc(seccion.titulo)}</span>
        ${etiquetaQuien}
        <span class="progreso${completa ? " completa" : ""}" data-progreso="${esc(seccion.id)}">${contestadas} de ${total}</span>
      </summary>
      <div class="cuerpo">
        ${seccion.descripcion ? `<p class="desc">${esc(seccion.descripcion)}</p>` : ""}
        <div class="form-grid">${campos}</div>
      </div>
    </details>`;
}

/** Una pregunta suelta. */
export function dibujarPregunta(
  p: Pregunta,
  valor: unknown,
  soloLectura = false
): string {
  const ancho = p.ancho === "completo" ? " completo" : "";
  const ayuda = p.ayuda ? `<div class="ayuda">${esc(p.ayuda)}</div>` : "";
  const dis = soloLectura ? " disabled" : "";

  let control = "";

  switch (p.tipo) {
    case "texto":
      control = `<input type="text" data-campo="${esc(p.id)}" value="${esc(valor as string)}" placeholder="${esc(p.placeholder ?? "")}"${dis}>`;
      break;

    case "texto_largo":
      control = `<textarea data-campo="${esc(p.id)}" placeholder="${esc(p.placeholder ?? "")}"${dis}>${esc(valor as string)}</textarea>`;
      break;

    case "numero":
      control = `<input type="number" data-campo="${esc(p.id)}" value="${esc(valor as string)}"${dis}>`;
      break;

    case "fecha":
      control = `<input type="date" data-campo="${esc(p.id)}" value="${esc(valor as string)}"${dis}>`;
      break;

    case "opcion":
      control = `
        <select data-campo="${esc(p.id)}"${dis}>
          <option value="">— sin responder —</option>
          ${(p.opciones ?? [])
            .map(
              (o) =>
                `<option value="${esc(o)}"${valor === o ? " selected" : ""}>${esc(o)}</option>`
            )
            .join("")}
        </select>`;
      break;

    case "si_no":
      control = botonesSiNo(p.id, (valor as string) ?? "", soloLectura);
      break;

    case "si_no_detalle": {
      const v = (valor ?? {}) as { valor?: string; detalle?: string };
      control = `
        ${botonesSiNo(p.id, v.valor ?? "", soloLectura)}
        <input type="text" class="detalle-sino" data-detalle="${esc(p.id)}"
               value="${esc(v.detalle ?? "")}" placeholder="¿Cuál? ¿Cuándo? Detalle"
               style="margin-top:8px${v.valor === "si" ? "" : ";display:none"}"${dis}>`;
      break;
    }

    case "multiple": {
      const marcadas = Array.isArray(valor) ? (valor as string[]) : [];
      control = `
        <div class="checklist" data-multiple="${esc(p.id)}">
          ${(p.opciones ?? [])
            .map((o) => {
              const on = marcadas.includes(o);
              return `<div class="chk${on ? " on" : ""}" data-opcion="${esc(o)}" role="checkbox" aria-checked="${on}" tabindex="0">
                        <span class="b">${ICONO.tilde}</span>${esc(o)}
                      </div>`;
            })
            .join("")}
        </div>`;
      break;
    }
  }

  return `
    <div class="field${ancho}" data-pregunta="${esc(p.id)}" data-tipo="${esc(p.tipo)}">
      <label>${esc(p.label)}</label>
      ${control}
      ${ayuda}
    </div>`;
}

function botonesSiNo(id: string, valor: string, soloLectura: boolean): string {
  const dis = soloLectura ? " disabled" : "";
  return `
    <div class="sino" data-sino="${esc(id)}" title="Tocá de nuevo la opción elegida para borrar la respuesta">
      <button type="button" data-v="si" class="${valor === "si" ? "on" : ""}"${dis}>Sí</button>
      <button type="button" data-v="no" class="${valor === "no" ? "on" : ""}"${dis}>No</button>
    </div>`;
}

/* ═══════════════════════════ ACTIVAR ═══════════════════════════ */

/**
 * Hace funcionar los controles que no son inputs nativos (Sí/No y las casillas
 * de opción múltiple) dentro de un contenedor ya dibujado.
 *
 * `alCambiar` se llama en cada modificación: sirve para actualizar el contador
 * "3 de 12" del encabezado y para marcar que hay cambios sin guardar.
 */
export function activarFormulario(
  raiz: HTMLElement,
  alCambiar?: () => void
): void {
  // Sí / No — tocar la opción ya elegida la borra (vuelve a "sin responder").
  raiz.querySelectorAll<HTMLElement>("[data-sino]").forEach((grupo) => {
    grupo.querySelectorAll<HTMLButtonElement>("button").forEach((boton) => {
      boton.addEventListener("click", () => {
        if (boton.disabled) return;
        const yaEstaba = boton.classList.contains("on");
        grupo.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
        if (!yaEstaba) boton.classList.add("on");

        // Si la pregunta tiene detalle, mostrarlo solo cuando la respuesta es "sí".
        const id = grupo.dataset.sino!;
        const detalle = raiz.querySelector<HTMLInputElement>(`[data-detalle="${CSS.escape(id)}"]`);
        if (detalle) {
          const esSi = !yaEstaba && boton.dataset.v === "si";
          detalle.style.display = esSi ? "" : "none";
          if (!esSi) detalle.value = "";
        }
        alCambiar?.();
      });
    });
  });

  // Opción múltiple.
  raiz.querySelectorAll<HTMLElement>("[data-multiple] .chk").forEach((casilla) => {
    const alternar = () => {
      const on = casilla.classList.toggle("on");
      casilla.setAttribute("aria-checked", String(on));
      alCambiar?.();
    };
    casilla.addEventListener("click", alternar);
    casilla.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        alternar();
      }
    });
  });

  // Inputs comunes.
  raiz.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", () => alCambiar?.());
    el.addEventListener("change", () => alCambiar?.());
  });
}

/* ═══════════════════════════ LEER ═══════════════════════════ */

/**
 * Recorre el formulario dibujado y arma el objeto de respuestas listo para
 * guardar. Solo incluye lo que tiene contenido: así el JSON no se llena de
 * campos vacíos y el contador de progreso es honesto.
 */
export function leerFormulario(raiz: HTMLElement): Respuestas {
  const respuestas: Respuestas = {};

  raiz.querySelectorAll<HTMLElement>("[data-pregunta]").forEach((campo) => {
    const id = campo.dataset.pregunta!;
    const tipo = campo.dataset.tipo!;

    if (tipo === "si_no" || tipo === "si_no_detalle") {
      const elegido = campo.querySelector<HTMLButtonElement>("[data-sino] button.on");
      const valor = elegido?.dataset.v ?? "";
      if (tipo === "si_no") {
        if (valor) respuestas[id] = valor;
      } else {
        const detalle =
          campo.querySelector<HTMLInputElement>("[data-detalle]")?.value.trim() ?? "";
        if (valor || detalle) respuestas[id] = { valor, detalle };
      }
      return;
    }

    if (tipo === "multiple") {
      const marcadas = [...campo.querySelectorAll<HTMLElement>(".chk.on")].map(
        (c) => c.dataset.opcion!
      );
      if (marcadas.length) respuestas[id] = marcadas;
      return;
    }

    const control = campo.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "[data-campo]"
    );
    const valor = control?.value?.trim() ?? "";
    if (valor) respuestas[id] = valor;
  });

  return respuestas;
}

/**
 * Combina lo que se acaba de cargar con lo que ya estaba guardado.
 *
 * ⚠️ NO reemplazar las respuestas directamente por lo que devuelve
 * `leerFormulario`. Ese lee SOLO lo que está en pantalla, y no siempre está
 * todo: las secciones "Historia ginecológica" y "Antecedentes hormonales
 * masculinos" se muestran según el sexo del paciente. Si a alguien se le cargó
 * mal el sexo, se completó su historia y después se corrigió el dato, esa
 * sección desaparece de la pantalla — y guardar borraría todas sus respuestas
 * sin que nadie se entere.
 *
 * Por eso: de las preguntas que SÍ están en pantalla se toma el valor nuevo
 * (incluso vacío, porque borrar una respuesta a mano tiene que funcionar); las
 * que no están en pantalla se dejan como estaban.
 */
export function combinarRespuestas(
  anteriores: Respuestas | null | undefined,
  nuevas: Respuestas,
  raiz: HTMLElement
): Respuestas {
  const enPantalla = new Set(
    [...raiz.querySelectorAll<HTMLElement>("[data-pregunta]")].map(
      (c) => c.dataset.pregunta!
    )
  );

  const resultado: Respuestas = {};
  for (const [id, valor] of Object.entries(anteriores ?? {})) {
    if (!enPantalla.has(id)) resultado[id] = valor; // fuera de pantalla: se conserva
  }
  Object.assign(resultado, nuevas);
  return resultado;
}

/** Vuelve a calcular los contadores "3 de 12" de cada sección visible. */
export function actualizarProgresos(raiz: HTMLElement, secciones: Seccion[]): void {
  const respuestas = leerFormulario(raiz);
  for (const s of secciones) {
    const chip = raiz.querySelector<HTMLElement>(`[data-progreso="${CSS.escape(s.id)}"]`);
    if (!chip) continue;
    const { contestadas, total } = progresoSeccion(s, respuestas);
    chip.textContent = `${contestadas} de ${total}`;
    chip.classList.toggle("completa", contestadas === total && total > 0);
  }
}

/* ═══════════════════════════ MOSTRAR (solo lectura) ═══════════════════════════ */

/** Convierte una respuesta guardada en texto legible, para resúmenes e informes. */
export function respuestaEnTexto(valor: unknown): string {
  if (!tieneRespuesta(valor)) return "";
  if (Array.isArray(valor)) return valor.join(" · ");
  if (typeof valor === "object") {
    const v = valor as { valor?: string; detalle?: string };
    const si = v.valor === "si" ? "Sí" : v.valor === "no" ? "No" : "";
    return v.detalle ? `${si}${si ? " — " : ""}${v.detalle}` : si;
  }
  if (valor === "si") return "Sí";
  if (valor === "no") return "No";
  return String(valor);
}

/** Resumen de una sección en formato "dato / valor", omitiendo lo vacío. */
export function dibujarResumen(seccion: Seccion, respuestas: Respuestas): string {
  const filas = seccion.preguntas
    .filter((p) => tieneRespuesta(respuestas?.[p.id]))
    .map(
      (p) =>
        `<div><dt>${esc(p.label)}</dt><dd>${esc(respuestaEnTexto(respuestas[p.id]))}</dd></div>`
    );
  if (!filas.length) return "";
  return `<div class="dl">${filas.join("")}</div>`;
}
