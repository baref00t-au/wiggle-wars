import type { Input } from '../sim/types';
import type { InputSource } from './inputSource';

/** Maps a pair of keys (left/right) to one player. Multiple keys per direction
 *  are allowed so e.g. arrows and A/D can both drive the same player. */
export interface KeyBinding {
  playerId: string;
  left: string[];
  right: string[];
}

/** Default two-key-per-player layout for same-device play (Phase 3). */
export const DEFAULT_BINDINGS: KeyBinding[] = [
  { playerId: 'p1', left: ['a'], right: ['d'] },
  { playerId: 'p2', left: ['ArrowLeft'], right: ['ArrowRight'] },
  { playerId: 'p3', left: ['j'], right: ['l'] },
  { playerId: 'p4', left: ['z'], right: ['c'] },
];

/** Normalize a key to match our binding strings: single chars lowercased,
 *  named keys (ArrowLeft, …) left as-is. */
function normalizeKey(e: KeyboardEvent): string {
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

export class LocalKeyboardInput implements InputSource {
  private pressed = new Set<string>();

  constructor(
    private bindings: KeyBinding[],
    private target: Window = window,
  ) {
    this.target.addEventListener('keydown', this.onKeyDown);
    this.target.addEventListener('keyup', this.onKeyUp);
  }

  private isBound(key: string): boolean {
    return this.bindings.some((b) => b.left.includes(key) || b.right.includes(key));
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const key = normalizeKey(e);
    if (this.isBound(key)) {
      this.pressed.add(key);
      e.preventDefault(); // stop arrow keys scrolling the page
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.pressed.delete(normalizeKey(e));
  };

  getInputs(): Input[] {
    return this.bindings.map((b) => {
      const left = b.left.some((k) => this.pressed.has(k));
      const right = b.right.some((k) => this.pressed.has(k));
      const turn: -1 | 0 | 1 = left && !right ? -1 : right && !left ? 1 : 0;
      return { playerId: b.playerId, turn };
    });
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.onKeyDown);
    this.target.removeEventListener('keyup', this.onKeyUp);
    this.pressed.clear();
  }
}
