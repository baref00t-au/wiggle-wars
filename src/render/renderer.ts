import type { GameState } from '../sim/types';
import { ARENA_BORDER, ARENA_FILL, colorFor, type PlayerShape } from './colors';

/** Death effect duration, in wall-clock ms. Driven by the clock (not sim ticks)
 *  so it still animates after the final death freezes the simulation. */
const DEATH_FX_MS = 650;

/**
 * Draws a GameState onto a canvas. Read-only: never mutates state. The sim runs
 * in fixed logical units (config arena size); this scales them to the canvas
 * with a uniform letterbox so gameplay looks identical on every screen, and
 * accounts for devicePixelRatio for crisp lines.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  /** Wall-clock time each player was first seen dead, for the death effect. */
  private deathSeen = new Map<string, number>();

  constructor(
    private canvas: HTMLCanvasElement,
    private arenaW: number,
    private arenaH: number,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context is unavailable');
    this.ctx = ctx;
  }

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
    const now = performance.now();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const s = this.dpr * this.scale;
    ctx.setTransform(s, 0, 0, s, this.dpr * this.offsetX, this.dpr * this.offsetY);

    // Arena.
    ctx.fillStyle = ARENA_FILL;
    ctx.fillRect(0, 0, this.arenaW, this.arenaH);
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 4;
    ctx.strokeStyle = ARENA_BORDER;
    ctx.strokeRect(0, 0, this.arenaW, this.arenaH);

    const thickness = state.config.lineThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const p of state.players) {
      const color = colorFor(p.colorIndex);

      if (p.trail.length > 0) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = color.line;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(p.trail[0].ax, p.trail[0].ay);
        for (const seg of p.trail) ctx.lineTo(seg.bx, seg.by);
        ctx.stroke();
      }

      if (p.alive) {
        this.deathSeen.delete(p.id);

        // During the countdown, show which way each line will set off.
        if (state.status === 'countdown') {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = color.head;
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(
            p.x + Math.cos(p.heading) * thickness * 7,
            p.y + Math.sin(p.heading) * thickness * 7,
          );
          ctx.stroke();
        }

        // Glowing head, drawn as the player's distinct shape (a non-colour cue).
        ctx.save();
        ctx.shadowColor = color.line;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color.head;
        this.drawShape(ctx, color.shape, p.x, p.y, thickness * 1.8);
        ctx.restore();
      } else {
        if (!this.deathSeen.has(p.id)) this.deathSeen.set(p.id, now);
        const age = now - (this.deathSeen.get(p.id) ?? now);
        if (age < DEATH_FX_MS) {
          this.drawDeathFx(ctx, p.x, p.y, color.head, age / DEATH_FX_MS, thickness);
        }
      }
    }

    ctx.shadowBlur = 0;
  }

  /** Fill the player's identity shape (centred at x,y, roughly radius r). */
  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: PlayerShape,
    x: number,
    y: number,
    r: number,
  ): void {
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (shape === 'square') {
      ctx.rect(x - r, y - r, 2 * r, 2 * r);
    } else if (shape === 'diamond') {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
    } else if (shape === 'triangle') {
      ctx.moveTo(x, y - r * 1.15);
      ctx.lineTo(x + r, y + r * 0.8);
      ctx.lineTo(x - r, y + r * 0.8);
      ctx.closePath();
    } else if (shape === 'hexagon') {
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      // star
      const outer = r * 1.2;
      const inner = r * 0.5;
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = x + Math.cos(a) * rad;
        const py = y + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }
    ctx.fill();
  }

  private drawDeathFx(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    t: number,
    thickness: number,
  ): void {
    const ease = 1 - (1 - t) * (1 - t);
    const radius = thickness * 2 + ease * thickness * 10;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * (1 - t) + 0.5;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    const spokes = 8;
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * radius * 0.4, y + Math.sin(a) * radius * 0.4);
      ctx.lineTo(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
      ctx.stroke();
    }
    ctx.restore();
  }
}
