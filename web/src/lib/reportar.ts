/**
 * "Reportar un problema": el botón del menú lateral.
 *
 * Quien usa el sistema escribe qué pasó y, si quiere, suma una captura de
 * pantalla (eligiendo la imagen o pegándola con Ctrl+V). El reporte queda
 * guardado en la collection `reportes` y:
 *
 *   · Emiliano y el administrador lo ven en Configuración → Problemas reportados.
 *   · Si el servidor tiene configurado el envío de correo, además le llega por
 *     mail a Emiliano con la captura adjunta (pb_hooks/reportes.pb.js).
 *
 * El reporte se guarda SIEMPRE, salga o no salga el mail: nada se pierde.
 *
 * Mismo molde que el del sistema DPRD, adaptado a los modales de CAPINOA.
 */

import { pb } from "./pocketbase";
import { usuarioActual } from "./auth";
import { aviso, mensajeDeError, esc, ICONO } from "./ui";

export const TIPOS_REPORTE: Record<string, string> = {
  error: "Algo no funciona",
  duda: "No sé cómo hacer algo",
  mejora: "Una idea para mejorar",
  otro: "Otra cosa",
};

export type Reporte = {
  id: string;
  collectionId?: string;
  collectionName?: string;
  titulo: string;
  cuerpo: string;
  tipo?: string;
  captura?: string;
  autor?: string;
  pagina_origen?: string;
  email_enviado?: boolean;
  resuelto?: boolean;
  created: string;
  updated: string;
  expand?: { autor?: { nombre?: string; email?: string } };
};

/** Abre el cuadro para escribir un reporte. */
export function abrirReporte(): void {
  const dlg = document.createElement("dialog");
  dlg.className = "modal";
  dlg.style.maxWidth = "560px";
  dlg.innerHTML = `
    <div class="modal-head">
      <h3>Reportar un problema</h3>
      <button class="modal-cerrar" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <p class="section-desc" style="margin-top:0">
        Contale a Emiliano qué pasó o qué necesitás. Si podés, sumá una captura
        de la pantalla: ayuda mucho a encontrar el problema.
      </p>
      <div class="form-grid">
        <div class="field completo">
          <label for="repTipo">¿De qué se trata?</label>
          <select id="repTipo">
            ${Object.entries(TIPOS_REPORTE)
              .map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field completo">
          <label for="repTitulo">En pocas palabras <span class="req">*</span></label>
          <input type="text" id="repTitulo" maxlength="150" autocomplete="off"
                 placeholder="Ej: no me deja guardar un turno">
        </div>
        <div class="field completo">
          <label for="repCuerpo">Contalo con detalle <span class="req">*</span></label>
          <textarea id="repCuerpo" rows="5" maxlength="5000"
                    placeholder="Qué estabas haciendo, qué esperabas que pasara y qué pasó."></textarea>
        </div>
        <div class="field completo">
          <label>Captura de pantalla (opcional)</label>
          <input type="file" id="repArchivo" accept="image/*" hidden>
          <div class="toolbar" style="margin:0">
            <button type="button" class="btn btn-ghost btn-sm" id="repElegir">${ICONO.subir} Elegir imagen</button>
            <span class="ayuda" style="margin:0">o pegala acá con Ctrl+V</span>
          </div>
          <div id="repVista" class="hidden" style="margin-top:10px">
            <img id="repVistaImg" alt="Captura adjunta"
                 style="max-width:100%; max-height:180px; border-radius:8px; border:1px solid var(--line); display:block">
            <button type="button" class="btn btn-ghost btn-sm" id="repQuitar" style="margin-top:8px">Quitar la captura</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost btn-sm" id="repCancelar">Cancelar</button>
      <button class="btn btn-primary btn-sm" id="repEnviar">${ICONO.guardar} Enviar</button>
    </div>`;

  document.body.appendChild(dlg);
  dlg.showModal();

  const q = <T extends HTMLElement>(sel: string) => dlg.querySelector(sel) as T;
  const archivo = q<HTMLInputElement>("#repArchivo");
  const vista = q<HTMLElement>("#repVista");
  const vistaImg = q<HTMLImageElement>("#repVistaImg");
  let captura: File | null = null;
  let urlVista = "";

  const cerrar = () => {
    dlg.close();
  };
  dlg.addEventListener("close", () => {
    if (urlVista) URL.revokeObjectURL(urlVista);
    dlg.remove();
  });
  q(".modal-cerrar").addEventListener("click", cerrar);
  q("#repCancelar").addEventListener("click", cerrar);

  const ponerCaptura = (f: File | null) => {
    if (urlVista) URL.revokeObjectURL(urlVista);
    captura = f;
    if (!f) {
      urlVista = "";
      archivo.value = "";
      vista.classList.add("hidden");
      return;
    }
    urlVista = URL.createObjectURL(f);
    vistaImg.src = urlVista;
    vista.classList.remove("hidden");
  };

  q("#repElegir").addEventListener("click", () => archivo.click());
  archivo.addEventListener("change", () => ponerCaptura(archivo.files?.[0] ?? null));
  q("#repQuitar").addEventListener("click", () => ponerCaptura(null));

  // Pegar una captura desde el portapapeles (Ctrl+V).
  dlg.addEventListener("paste", (ev) => {
    const items = (ev as ClipboardEvent).clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) {
          ponerCaptura(f);
          ev.preventDefault();
        }
        break;
      }
    }
  });

  q("#repEnviar").addEventListener("click", async () => {
    const boton = q<HTMLButtonElement>("#repEnviar");
    const titulo = q<HTMLInputElement>("#repTitulo").value.trim();
    const cuerpo = q<HTMLTextAreaElement>("#repCuerpo").value.trim();
    if (titulo.length < 2) {
      aviso("Escribí en pocas palabras de qué se trata.", "error");
      q<HTMLInputElement>("#repTitulo").focus();
      return;
    }
    if (!cuerpo) {
      aviso("Contá con un poco de detalle qué pasó.", "error");
      q<HTMLTextAreaElement>("#repCuerpo").focus();
      return;
    }

    const datos = new FormData();
    datos.set("titulo", titulo);
    datos.set("cuerpo", cuerpo);
    datos.set("tipo", q<HTMLSelectElement>("#repTipo").value);
    datos.set("pagina_origen", (location.pathname + location.search).slice(0, 500));
    const yo = usuarioActual();
    if (yo) datos.set("autor", yo.id);
    // Nombre corto y fijo: las capturas pegadas vienen sin nombre o con uno
    // larguísimo (mismo criterio que las fotos de pacientes).
    if (captura) {
      const ext = captura.type === "image/jpeg" ? "jpg" : captura.type === "image/webp" ? "webp" : "png";
      datos.set("captura", captura, `captura.${ext}`);
    }

    boton.disabled = true;
    try {
      await pb.collection("reportes").create(datos);
      aviso("Reporte enviado. ¡Gracias!");
      cerrar();
    } catch (e) {
      aviso(mensajeDeError(e), "error");
      boton.disabled = false;
    }
  });

  q<HTMLInputElement>("#repTitulo").focus();
}
