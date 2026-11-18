/**
 * Cliente de PocketBase compartido por todo el sistema.
 *
 * ¿A qué dirección le habla?
 *
 *   · Publicado (en internet o servido por PocketBase en una compu): a LA MISMA
 *     dirección desde la que se abrió la pantalla. PocketBase sirve las
 *     pantallas y los datos juntos, así que no hay nada que configurar y el
 *     sistema funciona igual en la dirección provisoria y en la definitiva.
 *
 *   · Programando (`npm run dev`, puerto 4321): las pantallas las sirve Astro
 *     y los datos PocketBase, que está en otro puerto. Para ese caso existe la
 *     variable PUBLIC_POCKETBASE_URL del archivo web/.env (el prefijo "PUBLIC_"
 *     es obligatorio: Astro solo le pasa al navegador las que empiezan así).
 */

import PocketBase from "pocketbase";

const url =
  import.meta.env.PUBLIC_POCKETBASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8090");

export const pb = new PocketBase(url);

/** Rol de un usuario del sistema. */
export type Rol = "admin" | "medico" | "recepcion";

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  matricula?: string;
  telefono?: string;
  activo: boolean;
  /** Contraseña provisoria: tiene que cambiarla antes de usar el sistema. */
  debe_cambiar_clave?: boolean;
  created: string;
  updated: string;
};

export type Paciente = {
  id: string;
  apellido: string;
  nombre: string;
  dni?: string;
  fecha_nacimiento?: string;
  sexo?: "masculino" | "femenino" | "otro";
  telefono?: string;
  email?: string;
  domicilio?: string;
  localidad?: string;
  ocupacion?: string;
  como_llego?: string;
  como_llego_detalle?: string;
  estado?: string;
  fecha_primera_consulta?: string;
  medico?: string;
  observaciones?: string;
  origen?: string;
  creado_por?: string;
  created: string;
  updated: string;
};

export type Historia = {
  id: string;
  paciente: string;
  respuestas: Record<string, unknown>;
  completado_por?: "medico" | "recepcion" | "paciente";
  estado?: "borrador" | "completa" | "revisada";
  actualizado_por?: string;
  created: string;
  updated: string;
};

export type Evaluacion = {
  id: string;
  paciente: string;
  fecha: string;
  tipo: string;
  diagnostico_principal?: string;
  norwood?: string;
  ludwig?: string;
  sinclair?: string;
  candidato_fue?: string;
  uf_estimadas?: number;
  impresion?: string;
  proximo_control?: string;
  datos: Record<string, unknown>;
  profesional?: string;
  created: string;
  updated: string;
};

export type Foto = {
  id: string;
  paciente: string;
  evaluacion?: string;
  archivo: string;
  toma?: string;
  momento?: string;
  fecha?: string;
  notas?: string;
  subido_por?: string;
  created: string;
  updated: string;
};

/** Un trazo del marcado: color, grosor y los puntos por donde pasó el dedo/mouse. */
export type Trazo = {
  color: string;
  grosor: number;
  /** Coordenadas relativas (0 a 1) respecto del ancho/alto de la foto. */
  puntos: [number, number][];
};

export type Marcado = {
  id: string;
  foto: string;
  paciente: string;
  titulo?: string;
  trazos: Trazo[];
  render?: string;
  fecha?: string;
  creado_por?: string;
  created: string;
  updated: string;
};

/** URL de un archivo guardado en PocketBase (foto, render, etc.). */
export function urlArchivo(
  registro: { id: string; collectionId?: string; collectionName?: string },
  campo: string,
  opciones?: { thumb?: string }
): string {
  if (!campo) return "";
  return pb.files.getURL(registro as never, campo, opciones);
}
