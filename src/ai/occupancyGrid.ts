import type { GameState } from '../sim/types';

/**
 * A coarse grid marking which cells any trail passes through, rebuilt once per
 * AI decision. It lets the bots probe "is this point blocked?" in O(1) instead
 * of scanning every trail segment, so lookahead stays cheap on weak school
 * devices even late in a round with thousands of segments. (This is the spatial
 * grid the build plan notes as a later optimisation — used here only by the AI,
 * outside the pure simulation.)
 */
export class OccupancyGrid {
  readonly cols: number;
  readonly rows: number;
  private readonly cell: number;
  private readonly cells: Uint8Array;

  constructor(width: number, height: number, cell: number) {
    this.cell = cell;
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    this.cells = new Uint8Array(this.cols * this.rows);
  }

  rebuild(state: GameState): void {
    this.cells.fill(0);
    for (const p of state.players) {
      const trail = p.trail;
      for (let i = 0; i < trail.length; i++) {
        const s = trail[i];
        this.markSegment(s.ax, s.ay, s.bx, s.by);
      }
    }
  }

  /** True if (x,y) is outside the arena or sits on a marked (trail) cell. */
  occupied(x: number, y: number): boolean {
    const cx = Math.floor(x / this.cell);
    const cy = Math.floor(y / this.cell);
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return true;
    return this.cells[cy * this.cols + cx] === 1;
  }

  private markSegment(ax: number, ay: number, bx: number, by: number): void {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(len / (this.cell * 0.5)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      this.mark(ax + dx * t, ay + dy * t);
    }
  }

  /** Mark a cell and its 8 neighbours, giving the bots a one-cell safety buffer. */
  private mark(x: number, y: number): void {
    const cx = Math.floor(x / this.cell);
    const cy = Math.floor(y / this.cell);
    for (let oy = -1; oy <= 1; oy++) {
      const ny = cy + oy;
      if (ny < 0 || ny >= this.rows) continue;
      for (let ox = -1; ox <= 1; ox++) {
        const nx = cx + ox;
        if (nx < 0 || nx >= this.cols) continue;
        this.cells[ny * this.cols + nx] = 1;
      }
    }
  }
}
