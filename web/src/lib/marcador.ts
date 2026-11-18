/**
 * ============================================================================
 *  MARCADOR — dibujar sobre la foto del paciente
 * ============================================================================
 *
 * La foto va abajo, en un <img>. El dibujo va arriba, en un lienzo transparente.
 * Nunca se tocan: la foto original queda intacta para siempre.
 *
 * ── Por qué las coordenadas se guardan de 0 a 1 ──
 * Si guardáramos píxeles, el dibujo se correría al abrirlo en otra pantalla, o
 * al imprimirlo, o al rotar la tablet. Guardando "35% desde la izquierda, 20%
 * desde arriba", el trazo cae siempre en el mismo punto de la cabeza, en
 * cualquier tamaño. Lo mismo con el grosor, que se guarda referido a un ancho
 * de 1000 px y se reescala.
 *
 * Funciona con mouse, con dedo y con lápiz de tablet (pointer events).
 */

import type { Trazo } from "./pocketbase";

/** Ancho de referencia para que el grosor del trazo se vea igual en toda pantalla. */
const ANCHO_REFERENCIA = 1000;

export const COLORES_MARCADO = [
  { color: "#16A9B8", nombre: "Línea de implante" },
  { color: "#E8443C", nombre: "Zona a densificar" },
  { color: "#F4C020", nombre: "Zona donante" },
  { color: "#FFFFFF", nombre: "Anotación libre" },
];

export class Marcador {
  private contenedor: HTMLElement;
  private img: HTMLImageElement;
  private lienzo: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private observador?: ResizeObserver;

  trazos: Trazo[] = [];
  color = COLORES_MARCADO[0].color;
  grosor = 6;

  /** Se llama cada vez que cambia el dibujo (para habilitar "Guardar"). */
  alCambiar?: () => void;

  private dibujando = false;
  private trazoActual: Trazo | null = null;

  constructor(contenedor: HTMLElement) {
    this.contenedor = contenedor;
    this.img = contenedor.querySelector("img.foto")!;
    this.lienzo = contenedor.querySelector("canvas")!;
    this.ctx = this.lienzo.getContext("2d")!;

    this.ajustarTamaño();
    this.conectarEventos();

    // Si cambia el tamaño en pantalla (rotar la tablet, agrandar la ventana),
    // hay que rehacer el lienzo con la nueva resolución y redibujar.
    if (typeof ResizeObserver !== "undefined") {
      this.observador = new ResizeObserver(() => this.ajustarTamaño());
      this.observador.observe(this.img);
    }
  }

  /** El lienzo se dibuja a la resolución real de la pantalla, no a la lógica.
   *  Sin esto los trazos se ven borrosos en pantallas de alta densidad. */
  private ajustarTamaño(): void {
    const ancho = this.img.clientWidth;
    const alto = this.img.clientHeight;
    if (!ancho || !alto) return;
    const densidad = window.devicePixelRatio || 1;
    this.lienzo.width = Math.round(ancho * densidad);
    this.lienzo.height = Math.round(alto * densidad);
    this.redibujar();
  }

  private conectarEventos(): void {
    const punto = (e: PointerEvent): [number, number] => {
      const caja = this.lienzo.getBoundingClientRect();
      return [
        Math.min(1, Math.max(0, (e.clientX - caja.left) / caja.width)),
        Math.min(1, Math.max(0, (e.clientY - caja.top) / caja.height)),
      ];
    };

    this.lienzo.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      // Capturar el puntero mantiene el trazo aunque el dedo se vaya del borde.
      // Si el navegador no lo permite, se dibuja igual: no es imprescindible.
      try {
        this.lienzo.setPointerCapture(e.pointerId);
      } catch {
        /* seguimos sin captura */
      }
      this.dibujando = true;
      this.trazoActual = { color: this.color, grosor: this.grosor, puntos: [punto(e)] };
      this.trazos.push(this.trazoActual);
    });

    this.lienzo.addEventListener("pointermove", (e) => {
      if (!this.dibujando || !this.trazoActual) return;
      e.preventDefault();
      this.trazoActual.puntos.push(punto(e));
      this.redibujar();
    });

    const terminar = () => {
      if (!this.dibujando) return;
      this.dibujando = false;
      // Un toque sin arrastrar deja un punto: lo dejamos (sirve para marcar
      // un lunar o una cicatriz), pero avisamos que hubo cambio.
      this.trazoActual = null;
      this.alCambiar?.();
    };
    this.lienzo.addEventListener("pointerup", terminar);
    this.lienzo.addEventListener("pointercancel", terminar);
    this.lienzo.addEventListener("pointerleave", terminar);
  }

  /** Vuelve a pintar todos los trazos sobre el lienzo de pantalla. */
  redibujar(): void {
    const { width, height } = this.lienzo;
    this.ctx.clearRect(0, 0, width, height);
    for (const t of this.trazos) this.pintarTrazo(this.ctx, t, width, height);
  }

  /**
   * Pinta un trazo en cualquier lienzo (el de pantalla o el de exportación).
   * Suaviza la línea pasando curvas por los puntos medios: sin esto, un trazo
   * hecho con el dedo queda con los "codos" marcados.
   */
  private pintarTrazo(
    ctx: CanvasRenderingContext2D,
    trazo: Trazo,
    ancho: number,
    alto: number
  ): void {
    const puntos = trazo.puntos;
    if (!puntos.length) return;

    ctx.strokeStyle = trazo.color;
    ctx.fillStyle = trazo.color;
    ctx.lineWidth = trazo.grosor * (ancho / ANCHO_REFERENCIA);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const px = (p: [number, number]): [number, number] => [p[0] * ancho, p[1] * alto];

    // Un solo punto: es un toque, se pinta un puntito.
    if (puntos.length === 1) {
      const [x, y] = px(puntos[0]);
      ctx.beginPath();
      ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    let [x0, y0] = px(puntos[0]);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < puntos.length - 1; i++) {
      const [x1, y1] = px(puntos[i]);
      const [x2, y2] = px(puntos[i + 1]);
      ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
    }
    const [xf, yf] = px(puntos[puntos.length - 1]);
    ctx.lineTo(xf, yf);
    ctx.stroke();
  }

  /* ---------- Acciones ---------- */

  deshacer(): void {
    this.trazos.pop();
    this.redibujar();
    this.alCambiar?.();
  }

  limpiar(): void {
    this.trazos = [];
    this.redibujar();
    this.alCambiar?.();
  }

  cargar(trazos: Trazo[] | null | undefined): void {
    this.trazos = Array.isArray(trazos) ? trazos : [];
    this.redibujar();
  }

  get vacio(): boolean {
    return this.trazos.length === 0;
  }

  /** Mostrar u ocultar el dibujo (para comparar contra la foto limpia). */
  mostrarDibujo(visible: boolean): void {
    this.contenedor.classList.toggle("sin-dibujo", !visible);
  }

  /**
   * Genera un PNG con la foto y el dibujo ya combinados, a la resolución
   * original de la foto. Es lo que se guarda para mostrar rápido, imprimir o
   * mandarle al paciente.
   */
  async exportarPNG(): Promise<Blob> {
    const ancho = this.img.naturalWidth || this.img.clientWidth;
    const alto = this.img.naturalHeight || this.img.clientHeight;

    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext("2d")!;
    ctx.drawImage(this.img, 0, 0, ancho, alto);
    for (const t of this.trazos) this.pintarTrazo(ctx, t, ancho, alto);

    const blob = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, "image/png")
    );
    if (!blob) throw new Error("No se pudo generar la imagen del marcado.");
    return blob;
  }

  destruir(): void {
    this.observador?.disconnect();
  }
}
