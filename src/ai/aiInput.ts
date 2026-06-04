import type { GameConfig, GameState, Input, Player } from '../sim/types';
import type { InputSource } from '../input/inputSource';
import { OccupancyGrid } from './occupancyGrid';
import { Rng } from '../sim/rng';

export type Difficulty = 'easy' | 'normal' | 'hard';

interface AiParams {
  /** Steps of foresight for the survival check (~ steps × speed px). */
  lookahead: number;
  /** A move surviving within this many steps of the best counts as "safe too". */
  acceptMargin: number;
  /** Whether to claim territory via reachable-area (the strong behaviour). */
  useArea: boolean;
  /** How far to commit down a turn before measuring its reachable area — far
   *  enough that left/straight/right genuinely diverge. */
  areaProbe: number;
  /** Flood-fill cap (cells); larger = the bot distinguishes bigger regions. */
  areaCap: number;
  /** Per-decision chance of a deliberate slip, so the tier stays beatable. */
  mistakeChance: number;
}

// The skill ladder:
//  easy   — short sight, no territory sense, frequent slips: drifts and traps itself.
//  normal — real foresight + territory control: weaves to keep its own space large,
//           won't trap itself, and pressures you. A proper opponent.
//  hard   — deep foresight + big-picture territory control, never slips.
const PARAMS: Record<Difficulty, AiParams> = {
  easy: { lookahead: 26, acceptMargin: 8, useArea: false, areaProbe: 0, areaCap: 0, mistakeChance: 0.1 },
  normal: { lookahead: 48, acceptMargin: 7, useArea: true, areaProbe: 18, areaCap: 420, mistakeChance: 0 },
  hard: { lookahead: 82, acceptMargin: 6, useArea: true, areaProbe: 26, areaCap: 650, mistakeChance: 0 },
};

/** A fixed tier, or 'auto' — which rubber-bands toward the player each round. */
export type DifficultySetting = Difficulty | 'auto';

const AUTO_START = 0.5; // a notch below "normal" on the 0..1 skill scale
const AUTO_STEP = 0.12; // skill change per round
const AUTO_MIN = 0.1;
const AUTO_MAX = 1;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Interpolate AI parameters from a 0..1 skill level (very beatable → hard), for
 *  Auto. Lookahead (wall/trail reaction) is the main strength lever, so the low
 *  end is deliberately short-sighted and slip-prone to give a struggling player
 *  real room to win. */
function paramsForSkill(skill: number): AiParams {
  const s = clamp(skill, 0, 1);
  const useArea = s >= 0.35; // territory sense kicks in above the easiest band
  return {
    lookahead: Math.round(lerp(20, 82, s)),
    acceptMargin: Math.round(lerp(8, 6, s)),
    useArea,
    areaProbe: useArea ? Math.round(lerp(14, 26, s)) : 0,
    areaCap: useArea ? Math.round(lerp(320, 650, s)) : 0,
    mistakeChance: Math.max(0, lerp(0.22, 0, clamp(s / 0.7, 0, 1))),
  };
}

const SAFE_MIN = 4; // a move surviving fewer steps than this is "about to die"
const STRAIGHT_BIAS = 0.25; // gentle anti-jitter for the no-area (easy) tier
const ACTIONS: Array<-1 | 0 | 1> = [-1, 0, 1];

/**
 * Computer-controlled players. An ordinary InputSource: it reads the read-only
 * state (like a human looking at the screen) and returns left / straight / right
 * per bot. Decision = (1) keep only moves that survive the lookahead, then (2)
 * among those, take the one that leaves the most open space reachable ahead —
 * which yields space-filling, self-untrapping, territory-pressuring play.
 * Difficulty tunes foresight, whether territory is considered, and slip rate.
 */
export class AiInput implements InputSource {
  private readonly grid: OccupancyGrid;
  private readonly ids: Set<string>;
  private params: AiParams;
  private readonly wallMargin: number;
  private readonly selfSkip: number;
  private readonly rng = new Rng(0x7717);
  private readonly adaptive: boolean;
  private skill = AUTO_START;

  constructor(aiPlayerIds: string[], config: GameConfig, difficulty: DifficultySetting = 'normal') {
    this.ids = new Set(aiPlayerIds);
    this.adaptive = difficulty === 'auto';
    this.params = this.adaptive ? paramsForSkill(this.skill) : PARAMS[difficulty as Difficulty];
    this.grid = new OccupancyGrid(
      config.arenaWidth,
      config.arenaHeight,
      Math.max(6, config.lineThickness * 2.5),
    );
    // Keep a couple of line-widths off the walls so bots don't graze them.
    this.wallMargin = Math.max(6, config.lineThickness * 2);
    // Ignore trail hits within the first few steps so a bot doesn't "see" its own
    // neck just behind the head (mirrors the sim's self-collision grace).
    this.selfSkip = Math.max(3, config.graceSegments + 1);
  }

  get isAdaptive(): boolean {
    return this.adaptive;
  }

  /**
   * Rubber-band the bots one notch after a round (Auto only). Pass true if the
   * human outperformed the bots (→ harder), false if the bots won (→ easier).
   * Returns the direction actually applied, for player feedback.
   */
  nudgeSkill(humanOutperformed: boolean): 'up' | 'down' | 'same' {
    if (!this.adaptive) return 'same';
    const before = this.skill;
    this.skill = clamp(this.skill + (humanOutperformed ? AUTO_STEP : -AUTO_STEP), AUTO_MIN, AUTO_MAX);
    if (this.skill === before) return 'same';
    this.params = paramsForSkill(this.skill);
    return humanOutperformed ? 'up' : 'down';
  }

  getInputs(state: GameState): Input[] {
    if (this.ids.size === 0) return [];
    this.grid.rebuild(state);

    const out: Input[] = [];
    for (const p of state.players) {
      if (!this.ids.has(p.id)) continue;
      out.push({ playerId: p.id, turn: p.alive ? this.decide(p, state.config) : 0 });
    }
    return out;
  }

  private decide(p: Player, c: GameConfig): -1 | 0 | 1 {
    const pr = this.params;
    const survival = ACTIONS.map((a) => this.clearance(p.x, p.y, p.heading, a, c));

    // Easier tiers occasionally slip: pick any still-safe move at random.
    if (pr.mistakeChance > 0 && this.rng.next() < pr.mistakeChance) {
      const safe = ACTIONS.filter((_, i) => survival[i] >= SAFE_MIN);
      if (safe.length > 0) return safe[this.rng.int(safe.length)];
    }

    // (1) Survival is a hard gate: only consider moves about as safe as the best.
    const best = Math.max(survival[0], survival[1], survival[2]);

    let chosen: -1 | 0 | 1 = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < ACTIONS.length; i++) {
      const a = ACTIONS[i];
      if (survival[i] < best - pr.acceptMargin) continue;

      // (2) Among safe moves, prefer the one opening the most territory.
      let score: number;
      if (pr.useArea) {
        const probe = Math.min(survival[i] - 1, pr.areaProbe);
        score = this.areaAhead(p.x, p.y, p.heading, a, c, probe, pr.areaCap);
        if (a === 0) score += pr.areaCap * 0.02; // mild anti-jitter
      } else {
        score = survival[i] + (a === 0 ? STRAIGHT_BIAS : 0);
      }

      if (score > bestScore) {
        bestScore = score;
        chosen = a;
      }
    }
    return chosen;
  }

  /** Steps survived when committing to `turn` from this pose, capped at lookahead. */
  private clearance(x: number, y: number, heading: number, turn: -1 | 0 | 1, c: GameConfig): number {
    const max = this.params.lookahead;
    let h = heading;
    let px = x;
    let py = y;
    for (let s = 1; s <= max; s++) {
      h += turn * c.turnRate;
      px += Math.cos(h) * c.speed;
      py += Math.sin(h) * c.speed;
      if (
        px <= this.wallMargin ||
        px >= c.arenaWidth - this.wallMargin ||
        py <= this.wallMargin ||
        py >= c.arenaHeight - this.wallMargin
      ) {
        return s;
      }
      if (s >= this.selfSkip && this.grid.occupied(px, py)) return s;
    }
    return max;
  }

  /** Open area reachable after committing to `turn` for `steps` — large = room to
   *  keep playing; small = a closing pocket to avoid. */
  private areaAhead(
    x: number,
    y: number,
    heading: number,
    turn: -1 | 0 | 1,
    c: GameConfig,
    steps: number,
    cap: number,
  ): number {
    let h = heading;
    let px = x;
    let py = y;
    for (let s = 0; s < steps; s++) {
      h += turn * c.turnRate;
      px += Math.cos(h) * c.speed;
      py += Math.sin(h) * c.speed;
    }
    return this.grid.reachableArea(px, py, cap);
  }
}
