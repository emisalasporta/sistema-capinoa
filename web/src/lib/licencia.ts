/**
 * Licencia (lado del navegador).
 *
 * El sistema está activado para siempre: no hay período de prueba ni clave.
 * Esto solo consulta el estado para mostrarlo en Configuración.
 */

import { pb } from "./pocketbase";

export type EstadoLicencia = {
  activado: boolean;
  bloqueado: boolean;
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
