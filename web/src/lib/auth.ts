/**
 * Sesión y permisos.
 *
 * El "usuario del sistema" es un registro de la collection `equipo`. El login
 * guarda el token en el navegador (localStorage) y el SDK lo manda solo en
 * cada pedido siguiente.
 *
 * ── Los permisos se aplican DOS veces, a propósito ──
 *   1. En el servidor (reglas de las collections, en las migraciones). Es la
 *      barrera real: aunque alguien maneje la dirección a mano, PocketBase le
 *      responde vacío.
 *   2. Acá en el navegador. Solo para que la pantalla no muestre botones ni
 *      pestañas que después van a fallar.
 *
 * La regla de negocio de Ricardo: RECEPCIÓN NO VE HISTORIAS CLÍNICAS NI FOTOS.
 */

import { pb, type Rol, type Usuario } from "./pocketbase";

export function estaLogueado(): boolean {
  return pb.authStore.isValid;
}

export function usuarioActual(): Usuario | null {
  if (!pb.authStore.isValid || !pb.authStore.record) return null;
  return pb.authStore.record as unknown as Usuario;
}

export function rolActual(): Rol | null {
  return usuarioActual()?.rol ?? null;
}

/** ¿Puede ver historias clínicas, evaluaciones y fotos de pacientes? */
export function puedeVerClinico(): boolean {
  const rol = rolActual();
  return rol === "admin" || rol === "medico";
}

/** ¿Puede ver el módulo de finanzas? */
export function puedeVerFinanzas(): boolean {
  const rol = rolActual();
  return rol === "admin" || rol === "medico";
}

/** ¿Puede administrar usuarios del sistema? */
export function puedeAdministrar(): boolean {
  return rolActual() === "admin";
}

/**
 * ¿Puede eliminar un paciente entero (con su historia, evaluaciones y fotos)?
 *
 * Espeja EXACTAMENTE el `deleteRule` de la collection `pacientes`. Si algún día
 * cambia allá, cambiar acá: si no, la pantalla ofrece un botón que el servidor
 * después rechaza, que es la peor combinación.
 */
export function puedeEliminarPacientes(): boolean {
  const rol = rolActual();
  return rol === "admin" || rol === "medico";
}

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  medico: "Médico",
  recepcion: "Recepción",
};

export async function ingresar(email: string, password: string): Promise<Usuario> {
  const r = await pb.collection("equipo").authWithPassword<Usuario>(email, password);
  return r.record;
}

export function salir(): void {
  pb.authStore.clear();
  window.location.href = "/login/";
}

/**
 * Guard para poner al principio de toda página interna.
 * Si no hay sesión, manda al login guardando a dónde quería ir.
 */
export function requiereSesion(): boolean {
  if (typeof window === "undefined") return false;
  if (!pb.authStore.isValid) {
    const aca = window.location.pathname + window.location.search;
    window.location.href = `/login/?volver=${encodeURIComponent(aca)}`;
    return false;
  }
  // Contraseña provisoria (la que le pasó Emiliano o el administrador): antes
  // de ver nada tiene que poner una propia.
  if (debeCambiarClave()) {
    window.location.href = "/cambiar-clave/";
    return false;
  }
  return true;
}

/** ¿Está entrando con una contraseña provisoria que todavía no cambió? */
export function debeCambiarClave(): boolean {
  return usuarioActual()?.debe_cambiar_clave === true;
}

/** Largo mínimo de las contraseñas. Espeja el mínimo que exige el servidor. */
export const LARGO_MINIMO_CLAVE = 10;

/**
 * Vuelve a pedir el usuario al servidor cada tanto.
 *
 * Para qué: el SDK guarda una copia del usuario en el navegador y no la
 * actualiza sola. Si el admin le cambia el rol a alguien, esa persona seguiría
 * viendo lo de antes hasta cerrar sesión.
 *
 * ⚠️ CUIDADO AL TOCAR ESTO — acá se cerraban sesiones que estaban perfectas.
 *
 * Antes, cualquier falla de este pedido cerraba la sesión. Pero el pedido falla
 * por motivos totalmente normales: el usuario hace clic en algo y el navegador
 * cancela lo que estaba pidiendo, o se corta un instante la conexión. Resultado:
 * al paciente lo sacaba al login de la nada.
 *
 * Ahora la sesión SOLO se cierra si el servidor dice explícitamente que el
 * token no vale (401) o que el usuario ya no tiene permiso (403) — o sea,
 * usuario dado de baja o borrado. Cualquier otra falla se ignora y se reintenta
 * en la próxima pantalla.
 */
export async function sincronizarSesion(): Promise<void> {
  if (typeof window === "undefined" || !pb.authStore.isValid) return;

  // No hace falta preguntar en cada pantalla: alcanza con cada 5 minutos.
  const CLAVE_ULTIMO = "capinoa_ultimo_refresh";
  const ahora = Date.now();
  if (ahora - Number(sessionStorage.getItem(CLAVE_ULTIMO) ?? 0) < 5 * 60 * 1000) return;

  const antes = pb.authStore.record?.rol;
  try {
    await pb.collection("equipo").authRefresh();
    sessionStorage.setItem(CLAVE_ULTIMO, String(ahora));
  } catch (e) {
    const codigo = (e as { status?: number })?.status;
    if (codigo === 401 || codigo === 403) {
      pb.authStore.clear();
      window.location.href = "/login/";
    }
    // Cualquier otro caso (pedido cancelado, sin conexión): no se toca nada.
    return;
  }

  // Si le cambiaron el rol, recargamos una vez para que el menú se rearme.
  const CLAVE = "capinoa_recarga_rol";
  if (antes !== pb.authStore.record?.rol) {
    if (!sessionStorage.getItem(CLAVE)) {
      sessionStorage.setItem(CLAVE, "1");
      window.location.reload();
    }
  } else {
    sessionStorage.removeItem(CLAVE);
  }
}
