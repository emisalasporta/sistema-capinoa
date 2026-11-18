// @ts-check
import { defineConfig } from "astro/config";

/**
 * Mismo criterio que el sistema DPRD: sitio estático.
 *
 * Las páginas se prerenderizan a HTML/JS/CSS y TODOS los datos se piden desde
 * el navegador a la API de PocketBase. Ventaja concreta para Capinoa: el
 * sistema entero son archivos sueltos que el propio PocketBase puede servir,
 * así en la notebook de Ricardo corre UN solo programa.
 */
export default defineConfig({
  output: "static",
  trailingSlash: "ignore",
  server: {
    port: 4321,
    host: true,
  },
});
