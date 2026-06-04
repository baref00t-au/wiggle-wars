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
  // Flood-fill scratch: `visited` stores a generation stamp so we never clear it.
  private readonly visited: Int32Array;
  private readonly queue: Int32Array;
  private gen = 0;

  constructor(width: number, height: number, cell: number) {
    this.cell = cell;
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell);
    this.cells = new Uint8Array(this.cols * this.rows);
    this.visited = new Int32Array(this.cols * this.rows);
    this.queue = new Int32Array(this.cols * this.rows);
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

  /**
   * Count free cells reachable (4-connected flood fill) from (x,y), capped at
   * `cap`. Lets a bot tell "drives into a wide-open region" from "drives into a
   * shrinking pocket" — the core of not trapping itself. O(cap), and the cap
   * keeps it cheap even on a big arena.
   */
  reachableArea(x: number, y: number, cap: number): number {
    const cols = this.cols;
    const cx = Math.floor(x / this.cell);
    const cy = Math.floor(y / this.cell);
    if (cx < 0 || cx >= cols || cy < 0 || cy >= this.rows) return 0;
    const start = cy * cols + cx;
    if (this.cells[start] === 1) return 0;

    const g = ++this.gen;
    const visited = this.visited;
    const queue = this.queue;
    const cells = this.cells;
    const rows = this.rows;

    let head = 0;
    let tail = 0;
    let count = 0;
    queue[tail++] = start;
    visited[start] = g;

    while (head < tail && count < cap) {
      const idx = queue[head++];
      count++;
      const x0 = idx % cols;
      const y0 = (idx / cols) | 0;
      if (x0 > 0) {
        const n = idx - 1;
        if (cells[n] === 0 && visited[n] !== g) {
          visited[n] = g;
          queue[tail++] = n;
        }
      }
      if (x0 < cols - 1) {
        const n = idx + 1;
        if (cells[n] === 0 && visited[n] !== g) {
          visited[n] = g;
          queue[tail++] = n;
        }
      }
      if (y0 > 0) {
        const n = idx - cols;
        if (cells[n] === 0 && visited[n] !== g) {
          visited[n] = g;
          queue[tail++] = n;
        }
      }
      if (y0 < rows - 1) {
        const n = idx + cols;
        if (cells[n] === 0 && visited[n] !== g) {
          visited[n] = g;
          queue[tail++] = n;
        }
      }
    }
    return count;
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

  /** Mark exactly the cell containing (x,y). No dilation: dilating would block a
   *  bot's own forward raycast with its freshly-laid trail right at the head. The
   *  cell size itself provides the safety buffer. */
  private mark(x: number, y: number): void {
    const cx = Math.floor(x / this.cell);
    const cy = Math.floor(y / this.cell);
    if (cx < 0 || cx >= this.cols || cy < 0 || cy >= this.rows) return;
    this.cells[cy * this.cols + cx] = 1;
  }
}
