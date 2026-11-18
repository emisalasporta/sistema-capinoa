/**
 * Período de prueba (lado del navegador).
 *
 * Acá solo se CONSULTA y se MUESTRA el estado. La decisión de dejar entrar o no
 * la toma el servidor (`pb_hooks/licencia.pb.js`): si la prueba venció,
 * PocketBase directamente no deja iniciar sesión. Esto de acá es el aviso, no
 * la cerradura.
 */

import { pb } from "./pocketbase";

export type EstadoLicencia = {
  activado: boolean;
  bloqueado: boolean;
  dias_restantes: number;
  dias_prueba: number;
};

export async function estadoLicencia(): Promise<EstadoLicencia | null> {
  try {
    const r = await fetch(`${pb.baseURL}/api/capinoa/licencia`);
    if (!r.ok) return null;
    return (await r.json()) as EstadoLicencia;
  } catch {
    return null;
  }
}

export async function activarSistema(
  clave: string
): Promise<{ ok: boolean; mensaje: string }> {
  try {
    const r = await fetch(`${pb.baseURL}/api/capinoa/activar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    const j = await r.json();
    return { ok: r.ok && j.ok, mensaje: j.mensaje ?? "No se pudo activar." };
  } catch {
    return { ok: false, mensaje: "No se pudo conectar con el sistema." };
  }
}

/** Abre el cuadro para escribir la clave de activación. */
export function pedirClave(alActivar?: () => void): void {
  const dlg = document.createElement("dialog");
  dlg.className = "modal";
  dlg.style.maxWidth = "440px";
  dlg.innerHTML = `
    <div class="modal-head">
      <h3>Activar CAPINOA</h3>
      <button class="modal-cerrar" aria-label="Cerrar">&times;</button>
    </div>
    <div class="modal-body">
      <p style="margin:0 0 16px; color:var(--muted); font-size:.9rem; line-height:1.55">
        Pedile la clave de activación a Emiliano y escribila acá. Es de una sola vez:
        después el sistema queda habilitado para siempre.
      </p>
      <div class="field">
        <label for="claveActivacion">Clave de activación</label>
        <input type="text" id="claveActivacion" autocomplete="off" spellcheck="false"
               placeholder="CAPINOA-..." style="text-transform:uppercase">
      </div>
      <div id="avisoClave" style="font-size:.85rem; font-weight:600; margin-top:10px"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost btn-sm" id="cancelarClave">Cancelar</button>
      <button class="btn btn-primary btn-sm" id="confirmarClave">Activar</button>
    </div>`;

  document.body.appendChild(dlg);
  dlg.showModal();
  (dlg.querySelector("#claveActivacion") as HTMLInputElement)?.focus();

  const cerrar = () => {
    dlg.close();
    dlg.remove();
  };
  dlg.querySelector(".modal-cerrar")?.addEventListener("click", cerrar);
  dlg.querySelector("#cancelarClave")?.addEventListener("click", cerrar);
  dlg.addEventListener("close", () => dlg.remove());

  const confirmar = async () => {
    const boton = dlg.querySelector("#confirmarClave") as HTMLButtonElement;
    const aviso = dlg.querySelector("#avisoClave") as HTMLElement;
    const clave = (dlg.querySelector("#claveActivacion") as HTMLInputElement).value;

    boton.disabled = true;
    aviso.textContent = "";
    const r = await activarSistema(clave);
    if (r.ok) {
      aviso.style.color = "var(--good)";
      aviso.textContent = r.mensaje;
      setTimeout(() => {
        cerrar();
        alActivar ? alActivar() : window.location.reload();
      }, 900);
    } else {
      aviso.style.color = "var(--bad)";
      aviso.textContent = r.mensaje;
      boton.disabled = false;
    }
  };

  dlg.querySelector("#confirmarClave")?.addEventListener("click", confirmar);
  dlg.querySelector("#claveActivacion")?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") confirmar();
  });
}

/**
 * Muestra la barra de aviso arriba de todo mientras dure la prueba.
 * Cuando el sistema ya está activado, no aparece nada.
 */
export async function mostrarAvisoDePrueba(contenedor: HTMLElement): Promise<void> {
  const s = await estadoLicencia();
  if (!s || s.activado) return;

  const dias = s.dias_restantes;
  const tono = dias <= 0 ? "bad" : dias <= 5 ? "warn" : "info";
  const texto =
    dias <= 0
      ? "El período de prueba terminó."
      : dias === 1
        ? "Período de prueba: queda 1 día."
        : `Período de prueba: quedan ${dias} días.`;

  contenedor.innerHTML = `
    <div class="barra-prueba ${tono}">
      <span>${texto}</span>
      <button type="button" class="btn btn-sm btn-ghost" id="activarDesdeBarra">Activar sistema</button>
    </div>`;
  contenedor
    .querySelector("#activarDesdeBarra")
    ?.addEventListener("click", () => pedirClave());
}
