import type { GameState } from '../sim/types';
import { ARENA_BORDER, ARENA_FILL, colorFor } from './colors';

/**
 * Draws a GameState onto a canvas. The renderer is read-only: it never mutates
 * state. The simulation runs in fixed logical units (config arena size); this
 * class scales those to the canvas with a uniform letterbox so gameplay looks
 * identical on any screen, and accounts for devicePixelRatio for crisp lines.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private arenaW: number,
    private arenaH: number,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is unavailable');
    this.ctx = ctx;
  }

  /** Recompute backing-store size and the logical->canvas transform. Call on
   *  startup and whenever the canvas changes size. */
  resize(): void {
    this.dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.scale = Math.min(cssW / this.arenaW, cssH / this.arenaH);
    this.offsetX = (cssW - this.arenaW * this.scale) / 2;
    this.offsetY = (cssH - this.arenaH * this.scale) / 2;
  }

  draw(state: GameState): void {
    const ctx = this.ctx;

    // Clear in device pixels.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Work in logical arena coordinates from here on.
    const s = this.dpr * this.scale;
    ctx.setTransform(s, 0, 0, s, this.dpr * this.offsetX, this.dpr * this.offsetY);

    // Arena.
    ctx.fillStyle = ARENA_FILL;
    ctx.fillRect(0, 0, this.arenaW, this.arenaH);
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 4;
    ctx.strokeStyle = ARENA_BORDER;
    ctx.strokeRect(0, 0, this.arenaW, this.arenaH);

    // Trails + heads.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const thickness = state.config.lineThickness;

    for (const p of state.players) {
      const color = colorFor(p.colorIndex);

      if (p.trail.length > 0) {
        ctx.strokeStyle = color.line;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].ax, p.trail[0].ay);
        for (const seg of p.trail) ctx.lineTo(seg.bx, seg.by);
        ctx.stroke();
      }

      if (p.alive) {
        ctx.fillStyle = color.head;
        ctx.beginPath();
        ctx.arc(p.x, p.y, thickness * 0.95, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
