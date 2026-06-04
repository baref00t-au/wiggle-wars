// The deterministic, transport-agnostic core of Wiggle Wars.
//
// This module knows NOTHING about rendering, the DOM, input devices, or the
// network. It is a pure function of (state, inputs) -> nextState. Every random
// choice flows through the seeded Rng so the same seed + same inputs always
// produce the same result — the property the determinism test guards forever.

import type {
  GameConfig,
  GameState,
  Input,
  Player,
  PlayerSpec,
  RoundStatus,
} from './types';
import { pointSegmentDistanceSq, segmentSegmentDistanceSq } from './collision';
import { Rng } from './rng';

const TAU = Math.PI * 2;

/** Nominal fixed timestep (seconds). The sim always advances exactly one tick per
 *  step() call; dt is informational only and never scales movement (that would
 *  make results frame-rate dependent and break determinism). */
export const FIXED_DT = 1 / 60;

/**
 * How many recent own-trail segments to ignore for self-collision. Sized from the
 * tightest possible turn: on a min-radius circle, find the smallest number of
 * segments whose chord distance from the head already exceeds the line thickness,
 * then add a small safety margin. This guarantees a normal hard turn never
 * self-kills, while a completed loop (far more segments back) still does.
 */
function computeGraceSegments(c: GameConfig): number {
  const threshold = c.lineThickness;
  const radius = c.speed / c.turnRate; // tightest turn radius
  let g = 1;
  while (g < 1000) {
    const chord = 2 * radius * Math.sin((g * c.turnRate) / 2);
    if (chord > threshold) break;
    g++;
  }
  return g + 1;
}

const DEFAULT_CONFIG: Omit<GameConfig, 'graceSegments'> = {
  arenaWidth: 1600,
  arenaHeight: 900,
  speed: 2.2,
  turnRate: 0.045,
  lineThickness: 3,
  targetScore: 5,
  tickRate: 60,
  countdownTicks: 180,
};

/** Build a config from partial overrides, deriving graceSegments. */
export function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  const merged = { ...DEFAULT_CONFIG, ...overrides, graceSegments: 0 };
  merged.graceSegments = computeGraceSegments(merged);
  return merged;
}

/** Place players: fixed spawn if provided, else seeded-random with separation. */
function spawnPlayers(specs: PlayerSpec[], config: GameConfig, rng: Rng): Player[] {
  const margin = Math.max(60, Math.min(config.arenaWidth, config.arenaHeight) * 0.08);
  const minSep = Math.min(config.arenaWidth, config.arenaHeight) * 0.18;
  const placed: { x: number; y: number }[] = [];

  return specs.map((spec) => {
    let x: number;
    let y: number;
    let heading: number;

    if (spec.spawn) {
      x = spec.spawn.x;
      y = spec.spawn.y;
      heading = spec.spawn.heading;
    } else {
      x = config.arenaWidth / 2;
      y = config.arenaHeight / 2;
      for (let attempt = 0; attempt < 60; attempt++) {
        const cx = rng.range(margin, config.arenaWidth - margin);
        const cy = rng.range(margin, config.arenaHeight - margin);
        x = cx;
        y = cy;
        const ok = placed.every(
          (p) => (p.x - cx) ** 2 + (p.y - cy) ** 2 >= minSep * minSep,
        );
        if (ok) break;
      }
      heading = rng.range(0, TAU);
    }

    placed.push({ x, y });
    return {
      id: spec.id,
      colorIndex: spec.colorIndex,
      name: spec.name ?? spec.id,
      x,
      y,
      heading,
      alive: true,
      score: 0,
      trail: [],
      diedAtTick: null,
    };
  });
}

/** Create a fresh match: round 1, scores at zero. */
export function createInitialState(
  config: GameConfig,
  specs: PlayerSpec[],
  seed: number,
): GameState {
  const rng = new Rng(seed);
  const players = spawnPlayers(specs, config, rng);
  return {
    config,
    width: config.arenaWidth,
    height: config.arenaHeight,
    players,
    tick: 0,
    status: config.countdownTicks > 0 ? 'countdown' : 'playing',
    countdown: Math.max(0, config.countdownTicks),
    rngState: rng.state,
    roundWinnerId: null,
    matchWinnerId: null,
  };
}

/** Start the next round: respawn everyone, clear trails, keep scores + match winner. */
export function resetRound(state: GameState, seed: number): GameState {
  const rng = new Rng(seed);
  const specs: PlayerSpec[] = state.players.map((p) => ({
    id: p.id,
    colorIndex: p.colorIndex,
    name: p.name,
  }));
  const spawned = spawnPlayers(specs, state.config, rng);
  const players = spawned.map((sp, i) => ({ ...sp, score: state.players[i].score }));
  return {
    ...state,
    players,
    tick: 0,
    status: state.config.countdownTicks > 0 ? 'countdown' : 'playing',
    countdown: Math.max(0, state.config.countdownTicks),
    rngState: rng.state,
    roundWinnerId: null,
  };
}

function buildInputMap(inputs: Input[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const input of inputs) m.set(input.playerId, input.turn);
  return m;
}

function stepCountdown(state: GameState): GameState {
  const countdown = state.countdown - 1;
  return {
    ...state,
    tick: state.tick + 1,
    countdown: Math.max(0, countdown),
    status: countdown <= 0 ? 'playing' : 'countdown',
  };
}

interface Candidate {
  idx: number;
  ax: number;
  ay: number;
  nx: number;
  ny: number;
  heading: number;
}

function stepPlaying(state: GameState, inputMap: Map<string, number>): GameState {
  const c = state.config;
  const radius = c.lineThickness / 2;
  const thresholdSq = c.lineThickness * c.lineThickness;
  const tick = state.tick + 1;

  // 1. Compute each alive player's intended move for this tick. Nothing is
  //    committed yet — deaths are resolved against this whole snapshot so the
  //    outcome never depends on player ordering.
  const candidates: Candidate[] = [];
  for (let idx = 0; idx < state.players.length; idx++) {
    const p = state.players[idx];
    if (!p.alive) continue;
    const turn = inputMap.get(p.id) ?? 0;
    const heading = p.heading + turn * c.turnRate;
    const nx = p.x + Math.cos(heading) * c.speed;
    const ny = p.y + Math.sin(heading) * c.speed;
    candidates.push({ idx, ax: p.x, ay: p.y, nx, ny, heading });
  }

  // 2. Decide who dies, testing every candidate against the tick-start world.
  const deadIdx = new Set<number>();
  for (const cand of candidates) {
    let dead = false;

    // Walls.
    if (
      cand.nx - radius <= 0 ||
      cand.nx + radius >= state.width ||
      cand.ny - radius <= 0 ||
      cand.ny + radius >= state.height
    ) {
      dead = true;
    }

    // Existing trails (all players), as they were at the start of the tick.
    // Skip the newest `graceSegments` of one's own trail so a hard turn is safe.
    if (!dead) {
      for (let qi = 0; qi < state.players.length && !dead; qi++) {
        const trail = state.players[qi].trail;
        const skip = qi === cand.idx ? c.graceSegments : 0;
        const limit = trail.length - skip;
        for (let i = 0; i < limit; i++) {
          const s = trail[i];
          if (pointSegmentDistanceSq(cand.nx, cand.ny, s.ax, s.ay, s.bx, s.by) < thresholdSq) {
            dead = true;
            break;
          }
        }
      }
    }

    // Head-on: this tick's new segments crossing each other (neither is in a
    // trail yet). Mutual — both players die, which yields a draw.
    if (!dead) {
      for (const other of candidates) {
        if (other.idx === cand.idx) continue;
        if (
          segmentSegmentDistanceSq(
            cand.ax,
            cand.ay,
            cand.nx,
            cand.ny,
            other.ax,
            other.ay,
            other.nx,
            other.ny,
          ) < thresholdSq
        ) {
          dead = true;
          break;
        }
      }
    }

    if (dead) deadIdx.add(cand.idx);
  }

  const candByIdx = new Map<number, Candidate>();
  for (const cand of candidates) candByIdx.set(cand.idx, cand);

  // 3. Apply: survivors advance and grow their trail; the dead stop where they
  //    were (the fatal segment is not drawn) and record their death tick.
  const deaths = deadIdx.size;
  let players = state.players.map((p, idx) => {
    if (!p.alive) return p;
    if (deadIdx.has(idx)) {
      return { ...p, alive: false, diedAtTick: tick };
    }
    const cand = candByIdx.get(idx)!;
    return {
      ...p,
      x: cand.nx,
      y: cand.ny,
      heading: cand.heading,
      trail: p.trail.concat([{ ax: cand.ax, ay: cand.ay, bx: cand.nx, by: cand.ny }]),
    };
  });

  // 4. Scoring (classic Achtung): every player still alive after this tick earns
  //    a point for each player that died this tick — i.e. for outlasting them.
  if (deaths > 0) {
    players = players.map((p) => (p.alive ? { ...p, score: p.score + deaths } : p));
  }

  // 5. Round / match end.
  const aliveCount = players.reduce((n, p) => (p.alive ? n + 1 : n), 0);
  const endThreshold = state.players.length >= 2 ? 1 : 0;
  let status: RoundStatus = state.status;
  let roundWinnerId = state.roundWinnerId;
  let matchWinnerId = state.matchWinnerId;

  if (aliveCount <= endThreshold) {
    status = 'roundOver';
    const survivors = players.filter((p) => p.alive);
    roundWinnerId = survivors.length === 1 ? survivors[0].id : null;
    let leader = players[0];
    for (const p of players) if (p.score > leader.score) leader = p;
    if (leader.score >= c.targetScore) matchWinnerId = leader.id;
  }

  return { ...state, players, tick, status, roundWinnerId, matchWinnerId };
}

/**
 * Advance the simulation by exactly one tick. `dt` is accepted for interface
 * symmetry with the game loop but intentionally unused — movement is per-tick.
 */
export function step(state: GameState, inputs: Input[], dt: number = FIXED_DT): GameState {
  void dt;
  if (state.status === 'countdown') return stepCountdown(state);
  if (state.status === 'playing') return stepPlaying(state, buildInputMap(inputs));
  return state; // roundOver: inert until the mode layer calls resetRound().
}
