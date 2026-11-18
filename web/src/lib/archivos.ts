/**
 * Acceso a los archivos guardados en PocketBase (fotos de pacientes y marcados).
 *
 * Las fotos están marcadas como PROTEGIDAS: no se pueden abrir con la dirección
 * suelta, hay que pedir antes un permiso temporal ("token") que el servidor solo
 * le da a quien tiene sesión válida.
 *
 * Además, todas las imágenes se bajan con `fetch` y se convierten en una
 * dirección local del navegador (objectURL) en vez de ponerlas directo en el
 * <img>. Eso resuelve dos cosas de una:
 *
 *   1. El permiso viaja en el pedido, sin quedar pegado en el HTML.
 *   2. El navegador considera la imagen "propia" y NO bloquea el lienzo de
 *      dibujo. Sin esto, al querer exportar el marcado como PNG el navegador
 *      lo impide por seguridad (la foto viene de otra dirección: el puerto
 *      8090 de PocketBase, distinto del de la aplicación).
 */

import { pb } from "./pocketbase";

/** El permiso dura unos minutos; lo guardamos para no pedirlo en cada foto. */
let tokenGuardado: { valor: string; vence: number } | null = null;

/**
 * Pedido de permiso en curso.
 *
 * ⚠️ Sin esto se rompía la galería. Al abrir una ficha con varias fotos, todas
 * piden el permiso al mismo tiempo; como todavía no hay ninguno guardado, se
 * disparan 8 pedidos idénticos a la vez. El cliente de PocketBase, al ver
 * pedidos repetidos, cancela los anteriores → esas fotos quedaban rotas.
 * Guardando la promesa, el primero pide y los demás esperan ese mismo.
 */
let pedidoEnCurso: Promise<string> | null = null;

async function tokenDeArchivos(): Promise<string> {
  const ahora = Date.now();
  if (tokenGuardado && tokenGuardado.vence > ahora) return tokenGuardado.valor;
  if (pedidoEnCurso) return pedidoEnCurso;

  pedidoEnCurso = (async () => {
    try {
      const valor = await pb.files.getToken();
      // Lo damos por bueno 90 segundos (el servidor lo acepta más tiempo, pero
      // así nunca se usa uno recién vencido).
      tokenGuardado = { valor, vence: Date.now() + 90_000 };
      return valor;
    } finally {
      pedidoEnCurso = null;
    }
  })();

  return pedidoEnCurso;
}

type RegistroConArchivo = {
  id: string;
  collectionId?: string;
  collectionName?: string;
  [campo: string]: unknown;
};

/** Direcciones locales creadas, para poder liberarlas y no dejar memoria colgada. */
const creadas = new Set<string>();

/**
 * Baja un archivo de PocketBase y devuelve una dirección local usable en <img>.
 * Devuelve "" si el registro no tiene ese archivo.
 */
export async function imagen(
  registro: RegistroConArchivo,
  campo = "archivo",
  opciones?: { thumb?: string }
): Promise<string> {
  const nombre = registro?.[campo];
  if (!nombre || typeof nombre !== "string") return "";

  const token = await tokenDeArchivos();
  const url = pb.files.getURL(registro as never, nombre, {
    ...(opciones?.thumb ? { thumb: opciones.thumb } : {}),
    token,
  });

  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`No se pudo bajar la imagen (${respuesta.status})`);
  const blob = await respuesta.blob();
  const local = URL.createObjectURL(blob);
  creadas.add(local);
  return local;
}

/** Libera una dirección local que ya no se usa. */
export function liberar(url?: string | null): void {
  if (!url || !creadas.has(url)) return;
  URL.revokeObjectURL(url);
  creadas.delete(url);
}

/** Libera todas (se llama al salir de la pantalla). */
export function liberarTodas(): void {
  for (const url of creadas) URL.revokeObjectURL(url);
  creadas.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", liberarTodas);
}

/**
 * Achica una foto antes de subirla.
 *
 * Una foto de celular pesa 4-8 MB y tiene mucha más resolución de la que hace
 * falta para una ficha. Bajarlas a 2000 px de lado largo mantiene todo el
 * detalle clínico útil y hace que la base no se infle: con 20 fotos por
 * paciente, la diferencia entre 6 MB y 600 KB por foto es la diferencia entre
 * una carpeta de 30 GB y una de 3 GB en la notebook de Ricardo.
 *
 * Si algo falla, devuelve el archivo original sin tocar: nunca se pierde la foto.
 */
export async function achicarFoto(archivo: File, ladoMaximo = 2000): Promise<File> {
  try {
    if (!archivo.type.startsWith("image/")) return archivo;

    const bitmap = await createImageBitmap(archivo);
    const { width, height } = bitmap;
    const escala = Math.min(1, ladoMaximo / Math.max(width, height));

    // Ya es chica: no vale la pena recomprimir (perdería calidad al pedo).
    if (escala === 1 && archivo.size < 1_500_000) {
      bitmap.close();
      return archivo;
    }

    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(width * escala);
    lienzo.height = Math.round(height * escala);
    const ctx = lienzo.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/jpeg", 0.9)
    );
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}
