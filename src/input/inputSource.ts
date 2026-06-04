import type { GameState, Input } from '../sim/types';

/**
 * A source of per-tick steering. The game loop polls getInputs() and feeds the
 * result straight into the simulation — it never knows whether those inputs came
 * from taps, a keyboard, an AI, or (Phase 5) the network. Every input mode
 * implements this same interface; that's what makes the sim transport-agnostic.
 *
 * The current read-only state is passed in for sources that need to "see" the
 * board (the AI); human sources simply ignore it.
 */
export interface InputSource {
  /** Current steering intent for every player this source manages. */
  getInputs(state: GameState): Input[];
  /** Remove any listeners / release resources. */
  dispose?(): void;
}
