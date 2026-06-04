import type { Input } from '../sim/types';
import type { InputSource } from './inputSource';

/**
 * Combines several input sources that manage the same players (e.g. keyboard +
 * touch on one device). For each player, a non-zero steering value from any
 * source wins; later sources override earlier ones when both are active.
 */
export class MergedInput implements InputSource {
  constructor(private sources: InputSource[]) {}

  getInputs(): Input[] {
    const turns = new Map<string, -1 | 0 | 1>();
    for (const source of this.sources) {
      for (const { playerId, turn } of source.getInputs()) {
        const current = turns.get(playerId) ?? 0;
        turns.set(playerId, turn !== 0 ? turn : current);
      }
    }
    return [...turns].map(([playerId, turn]) => ({ playerId, turn }));
  }

  dispose(): void {
    for (const source of this.sources) source.dispose?.();
  }
}
