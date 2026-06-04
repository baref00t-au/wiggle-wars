// Pure data types for the simulation. NO imports from rendering, DOM, or network.
// Everything here must be plain, serializable data so the whole GameState can be
// snapshotted, sent over the wire (Phase 4), and compared for determinism in tests.

export interface Vec2 {
  x: number;
  y: number;
}

/** One straight piece of a player's trail, from (ax,ay) to (bx,by). */
export interface TrailSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export type RoundStatus = 'countdown' | 'playing' | 'roundOver';

export interface Player {
  id: string;
  /** Index into the render palette. The sim stays free of colour/hex specifics. */
  colorIndex: number;
  name: string;
  /** Head position. */
  x: number;
  y: number;
  /** Heading in radians. */
  heading: number;
  alive: boolean;
  score: number;
  trail: TrailSegment[];
  /** The tick on which this player died, or null while alive. */
  diedAtTick: number | null;
}

/** A single tick's steering intent for one player. */
export interface Input {
  playerId: string;
  /** -1 = turn left, 0 = straight, +1 = turn right (held state, sampled per tick). */
  turn: -1 | 0 | 1;
}

export interface GameConfig {
  arenaWidth: number;
  arenaHeight: number;
  /** Pixels advanced per tick. */
  speed: number;
  /** Maximum heading change per tick, in radians (clamps turn sharpness). */
  turnRate: number;
  /** Full stroke width in pixels; also the head-vs-trail collision threshold. */
  lineThickness: number;
  /** First player to reach this score wins the match. */
  targetScore: number;
  /** Simulation ticks per second. Informational — the sim always steps one tick. */
  tickRate: number;
  /** Length of the pre-round countdown, in ticks. */
  countdownTicks: number;
  /**
   * How many of a player's most-recent own-trail segments are ignored for
   * self-collision, so a normal hard turn never clips its own neck. Derived from
   * turnRate + lineThickness by makeConfig() — do not hand-tune.
   */
  graceSegments: number;
}

/** Describes a player to spawn. `spawn` forces a fixed start (used by tests). */
export interface PlayerSpec {
  id: string;
  colorIndex: number;
  name?: string;
  spawn?: { x: number; y: number; heading: number };
}

export interface GameState {
  config: GameConfig;
  /** Arena dimensions (authoritative; never change mid-match). */
  width: number;
  height: number;
  players: Player[];
  /** Ticks elapsed in the current round. */
  tick: number;
  status: RoundStatus;
  /** Ticks remaining in the countdown (0 once playing). */
  countdown: number;
  /** Serializable PRNG state, so the whole sim is a pure function of GameState. */
  rngState: number;
  /** Set when a round ends: the sole survivor's id, or null on a draw. */
  roundWinnerId: string | null;
  /** Set when a player reaches targetScore. */
  matchWinnerId: string | null;
}
