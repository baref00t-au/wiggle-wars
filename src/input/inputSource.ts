import type { Input } from '../sim/types';

/**
 * A source of per-tick steering. The game loop polls getInputs() and feeds the
 * result straight into the simulation — it never knows whether those inputs came
 * from taps, a keyboard, or (Phase 5) the network. Every input mode implements
 * this same interface; that's what makes the sim transport-agnostic.
 */
export interface InputSource {
  /** Current steering intent for every player this source manages. */
  getInputs(): Input[];
  /** Remove any listeners / release resources. */
  dispose?(): void;
}
