import type { Input } from '../sim/types';
import type { InputSource } from './inputSource';
import { colorFor } from '../render/colors';
import { el } from '../ui/dom';

export interface TouchPlayer {
  id: string;
  colorIndex: number;
  name: string;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotate the region 180° so it reads right-way-up for a player on the far
   *  side of a flat tablet (the bottom-row quadrants in 4-player). */
  flip: boolean;
}

/**
 * Per-player screen regions, each split into a left-turn and right-turn half.
 * 2 players share the screen as columns; 3 as thirds; 4 as quadrants (corners).
 * Zones are deliberately large and obvious — kids, fast fingers.
 */
function layoutFor(n: number): Rect[] {
  if (n <= 1) {
    // Solo human (the rest are bots) gets the whole screen: left half turns
    // left, right half turns right.
    return [{ x: 0, y: 0, w: 100, h: 100, flip: false }];
  }
  if (n === 2) {
    return [
      { x: 0, y: 0, w: 50, h: 100, flip: false },
      { x: 50, y: 0, w: 50, h: 100, flip: false },
    ];
  }
  if (n === 3) {
    return [
      { x: 0, y: 0, w: 33.34, h: 100, flip: false },
      { x: 33.33, y: 0, w: 33.34, h: 100, flip: false },
      { x: 66.66, y: 0, w: 33.34, h: 100, flip: false },
    ];
  }
  // 4 players sit around the tablet — flip the bottom row for the far side.
  return [
    { x: 0, y: 0, w: 50, h: 50, flip: false },
    { x: 50, y: 0, w: 50, h: 50, flip: false },
    { x: 0, y: 50, w: 50, h: 50, flip: true },
    { x: 50, y: 50, w: 50, h: 50, flip: true },
  ];
}

export class LocalTouchInput implements InputSource {
  private layer: HTMLElement;
  /** Per player, how many active pointers hold each direction. */
  private turns = new Map<string, { left: number; right: number }>();
  /** Which (player, direction, zone) each active pointer is steering. */
  private pointerMap = new Map<number, { playerId: string; dir: 'left' | 'right'; zone: HTMLElement }>();

  constructor(
    container: HTMLElement,
    private players: TouchPlayer[],
  ) {
    this.layer = el('div', 'touch-layer');
    const rects = layoutFor(players.length);

    players.forEach((p, i) => {
      const r = rects[i];
      this.turns.set(p.id, { left: 0, right: 0 });

      const region = el('div', `touch-region${r.flip ? ' flipped' : ''}`);
      region.style.left = `${r.x}%`;
      region.style.top = `${r.y}%`;
      region.style.width = `${r.w}%`;
      region.style.height = `${r.h}%`;

      const col = colorFor(p.colorIndex);
      const name = el('div', 'touch-name', p.name);
      name.style.color = col.head;
      region.append(
        this.makeZone(p.id, 'left', '◀', col.line),
        this.makeZone(p.id, 'right', '▶', col.line),
        name,
      );
      this.layer.append(region);
    });

    container.append(this.layer);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp);
  }

  private makeZone(
    playerId: string,
    dir: 'left' | 'right',
    glyph: string,
    tint: string,
  ): HTMLElement {
    const zone = el('div', `touch-zone ${dir}`, glyph);
    zone.style.setProperty('--tint', tint);
    zone.addEventListener('pointerdown', (e) => this.onPointerDown(e, playerId, dir, zone));
    return zone;
  }

  private onPointerDown = (
    e: PointerEvent,
    playerId: string,
    dir: 'left' | 'right',
    zone: HTMLElement,
  ): void => {
    e.preventDefault();
    if (this.pointerMap.has(e.pointerId)) return;
    this.pointerMap.set(e.pointerId, { playerId, dir, zone });
    const t = this.turns.get(playerId);
    if (t) t[dir] += 1;
    zone.classList.add('active');
  };

  private onPointerUp = (e: PointerEvent): void => {
    const entry = this.pointerMap.get(e.pointerId);
    if (!entry) return;
    this.pointerMap.delete(e.pointerId);
    const t = this.turns.get(entry.playerId);
    if (t) {
      t[entry.dir] = Math.max(0, t[entry.dir] - 1);
      if (t[entry.dir] === 0) entry.zone.classList.remove('active');
    }
  };

  setVisible(visible: boolean): void {
    this.layer.style.display = visible ? 'block' : 'none';
    if (!visible) this.reset();
  }

  private reset(): void {
    this.pointerMap.clear();
    for (const t of this.turns.values()) {
      t.left = 0;
      t.right = 0;
    }
    this.layer.querySelectorAll('.touch-zone.active').forEach((z) => z.classList.remove('active'));
  }

  getInputs(): Input[] {
    return this.players.map((p) => {
      const t = this.turns.get(p.id) ?? { left: 0, right: 0 };
      const left = t.left > 0;
      const right = t.right > 0;
      const turn: -1 | 0 | 1 = left && !right ? -1 : right && !left ? 1 : 0;
      return { playerId: p.id, turn };
    });
  }

  dispose(): void {
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerUp);
    this.layer.remove();
  }
}
