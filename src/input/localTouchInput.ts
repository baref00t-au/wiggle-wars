import type { Input } from '../sim/types';
import type { InputSource } from './inputSource';
import { colorFor } from '../render/colors';
import { el } from '../ui/dom';

export interface TouchPlayer {
  id: string;
  colorIndex: number;
  name: string;
}

/** Where the fixed-size pads sit. `corners` seats the far pair across a flat
 *  tablet (rotated 180°); `edges` keeps every pad readable one-handed in phone
 *  landscape by pinning players 3–4 to the left / right edges. */
export type PadLayout = 'corners' | 'edges';

/** CSS placement class per seat; see .pad.seat-* in style.css. */
const CORNER_SEATS = ['seat-bl', 'seat-br', 'seat-tl flipped', 'seat-tr flipped'];
const EDGE_SEATS = ['seat-bl', 'seat-br', 'seat-l', 'seat-r'];

function seatsFor(n: number, layout: PadLayout): string[] {
  if (n <= 1) return ['seat-bc'];
  return (layout === 'edges' ? EDGE_SEATS : CORNER_SEATS).slice(0, n);
}

/**
 * Fixed-size steering pads (two 56px-tall zones each) anchored to the screen
 * corners, so on a tablet they take roughly a tenth of the screen instead of a
 * third. Each pad is split into a left-turn and right-turn zone; several
 * fingers per zone are counted so a rest-then-tap doesn't drop the turn.
 */
export class LocalTouchInput implements InputSource {
  private layer: HTMLElement;
  /** Per player, how many active pointers hold each direction. */
  private turns = new Map<string, { left: number; right: number }>();
  /** Which (player, direction, zone) each active pointer is steering. */
  private pointerMap = new Map<number, { playerId: string; dir: 'left' | 'right'; zone: HTMLElement }>();

  constructor(
    container: HTMLElement,
    private players: TouchPlayer[],
    layout: PadLayout = 'corners',
  ) {
    this.layer = el('div', 'touch-layer');
    const seats = seatsFor(players.length, layout);
    const wide = players.length <= 2;

    players.forEach((p, i) => {
      this.turns.set(p.id, { left: 0, right: 0 });
      const col = colorFor(p.colorIndex);

      const pad = el('div', `pad ${seats[i]}${wide ? ' wide' : ''}`);
      const name = el('div', 'pad-name', p.name);
      name.style.color = col.head;
      pad.append(
        this.makeZone(p.id, 'left', '◀', col.line),
        this.makeZone(p.id, 'right', '▶', col.line),
        name,
      );
      this.layer.append(pad);
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
    const zone = el('div', `pad-zone ${dir}`, glyph);
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
    this.layer.querySelectorAll('.pad-zone.active').forEach((z) => z.classList.remove('active'));
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
