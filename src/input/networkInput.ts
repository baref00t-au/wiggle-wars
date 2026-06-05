import type { Input } from '../sim/types';
import type { InputSource } from './inputSource';

// Host-side input for the remote (client) players. The host's game loop polls this
// like any other InputSource — it doesn't know the steering arrived over the wire.
// That's the payoff of the InputSource seam from Phase 1.

export class NetworkInput implements InputSource {
  private turns = new Map<string, -1 | 0 | 1>();

  /** Called when a client's steering message arrives. */
  setTurn(playerId: string, turn: -1 | 0 | 1): void {
    this.turns.set(playerId, turn);
  }

  remove(playerId: string): void {
    this.turns.delete(playerId);
  }

  getInputs(): Input[] {
    return [...this.turns].map(([playerId, turn]) => ({ playerId, turn }));
  }
}
