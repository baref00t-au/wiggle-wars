import type { GameConfig, GameState, Input, Player } from '../sim/types';
import type { InputSource } from '../input/inputSource';
import { OccupancyGrid } from './occupancyGrid';

/** How many steps ahead each bot looks when scoring a move (~ steps × speed px). */
const LOOKAHEAD = 60;
/** Treat moves within this many steps of the safest as equally safe, then break
 *  the tie by openness — keeps bots off walls instead of grazing them. */
const ACCEPT_MARGIN = 6;
/** Steps ahead used to measure how much open space a move leads into. */
const OPENNESS_STEPS = 18;

/**
 * Computer-controlled players. The AI is an ordinary InputSource: it reads the
 * read-only state (like a human looking at the screen) and returns left / straight
 * / right per bot. It steers deterministically — no randomness — so it never
 * threatens the determinism guarantee.
 *
 * Strategy: for each of the three actions, simulate committing to it for a short
 * lookahead and count how far the bot survives before hitting a wall or trail;
 * pick the safest, biased toward going straight to avoid the jitters.
 */
export class AiInput implements InputSource {
  private readonly grid: OccupancyGrid;
  private readonly ids: Set<string>;
  private readonly wallMargin: number;
  private readonly selfSkip: number;

  constructor(aiPlayerIds: string[], config: GameConfig) {
    this.ids = new Set(aiPlayerIds);
    this.grid = new OccupancyGrid(
      config.arenaWidth,
      config.arenaHeight,
      Math.max(6, config.lineThickness * 2.5),
    );
    // Keep a couple of line-widths off the walls so bots don't graze them.
    this.wallMargin = Math.max(6, config.lineThickness * 2);
    // Ignore trail hits within the first few steps so a bot doesn't "see" its
    // own neck just behind the head (mirrors the sim's self-collision grace).
    this.selfSkip = Math.max(3, config.graceSegments + 1);
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
    const actions: Array<-1 | 0 | 1> = [-1, 0, 1];
    const survival = actions.map((a) => this.clearance(p.x, p.y, p.heading, a, c));
    const best = Math.max(...survival);

    // Among the moves that are about as safe as the best, pick the one heading
    // into the most open space (furthest from walls); nudge ties toward straight.
    let chosen: -1 | 0 | 1 = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < actions.length; i++) {
      if (survival[i] < best - ACCEPT_MARGIN) continue;
      const steps = Math.min(survival[i], OPENNESS_STEPS);
      const open = this.openness(p.x, p.y, p.heading, actions[i], c, steps);
      const score = open + (actions[i] === 0 ? 4 : 0); // mild straight preference
      if (score > bestScore) {
        bestScore = score;
        chosen = actions[i];
      }
    }
    return chosen;
  }

  /** Distance to the nearest wall after committing to `turn` for `steps`. */
  private openness(
    x: number,
    y: number,
    heading: number,
    turn: -1 | 0 | 1,
    c: GameConfig,
    steps: number,
  ): number {
    let h = heading;
    let px = x;
    let py = y;
    for (let s = 0; s < steps; s++) {
      h += turn * c.turnRate;
      px += Math.cos(h) * c.speed;
      py += Math.sin(h) * c.speed;
    }
    return Math.min(px, c.arenaWidth - px, py, c.arenaHeight - py);
  }

  /** Steps survived when committing to `turn` from this pose, capped at LOOKAHEAD. */
  private clearance(
    x: number,
    y: number,
    heading: number,
    turn: -1 | 0 | 1,
    c: GameConfig,
  ): number {
    let h = heading;
    let px = x;
    let py = y;
    for (let s = 1; s <= LOOKAHEAD; s++) {
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
    return LOOKAHEAD;
  }
}
