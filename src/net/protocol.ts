import type { GameState, Player, RoundStatus, TrailSegment } from '../sim/types';
import type { RenderState } from '../render/renderer';

// The wire protocol for Phase 4 (same-WiFi). The host runs the authoritative sim
// and broadcasts; clients render what they receive and send only their steering.
//
// Trails grow by one segment per tick, so sending the whole trail every frame
// would be huge. Instead the host sends a full `reset` at round start (and to a
// late joiner), then compact `delta`s carrying only the NEW trail points since the
// last broadcast. Everything in this file is pure and deterministic — the transport
// (PeerJS) is a thin shell on top, so the tricky reconstruction logic is testable.

// ---- control / lobby messages ----

export interface JoinMsg {
  t: 'join';
  name: string;
}
export interface InputMsg {
  t: 'input';
  turn: -1 | 0 | 1;
}
export interface WelcomeMsg {
  t: 'welcome';
  playerId: string;
}
export interface LobbyMsg {
  t: 'lobby';
  players: { id: string; colorIndex: number; name: string }[];
}
export interface EndMsg {
  t: 'end';
  reason: string;
}

// ---- state sync ----

export interface NetPlayerFull {
  id: string;
  colorIndex: number;
  name: string;
  x: number;
  y: number;
  heading: number;
  alive: boolean;
  score: number;
  /** Flat polyline points of the whole trail: [x0,y0,x1,y1,...]. */
  pts: number[];
}

export interface ResetMsg {
  t: 'reset';
  lineThickness: number;
  arenaWidth: number;
  arenaHeight: number;
  tickRate: number;
  targetScore: number;
  tick: number;
  status: RoundStatus;
  countdown: number;
  roundWinnerId: string | null;
  matchWinnerId: string | null;
  players: NetPlayerFull[];
}

export interface NetPlayerDelta {
  id: string;
  x: number;
  y: number;
  heading: number;
  alive: boolean;
  score: number;
  /** New polyline points appended since the last broadcast: [x,y,x,y,...]. */
  np: number[];
}

export interface DeltaMsg {
  t: 'delta';
  tick: number;
  status: RoundStatus;
  countdown: number;
  roundWinnerId: string | null;
  matchWinnerId: string | null;
  players: NetPlayerDelta[];
}

export type HostMsg = WelcomeMsg | LobbyMsg | ResetMsg | DeltaMsg | EndMsg;
export type ClientMsg = JoinMsg | InputMsg;

/** Whole-trail polyline points: spawn point, then each segment's far end. */
function trailPoints(p: Pick<Player, 'x' | 'y' | 'trail'>): number[] {
  const pts: number[] = [];
  if (p.trail.length === 0) {
    pts.push(p.x, p.y);
  } else {
    pts.push(p.trail[0].ax, p.trail[0].ay);
    for (const s of p.trail) pts.push(s.bx, s.by);
  }
  return pts;
}

/** Full snapshot — sent at round start and to a late joiner. */
export function buildReset(state: GameState): ResetMsg {
  return {
    t: 'reset',
    lineThickness: state.config.lineThickness,
    arenaWidth: state.width,
    arenaHeight: state.height,
    tickRate: state.config.tickRate,
    targetScore: state.config.targetScore,
    tick: state.tick,
    status: state.status,
    countdown: state.countdown,
    roundWinnerId: state.roundWinnerId,
    matchWinnerId: state.matchWinnerId,
    players: state.players.map((p) => ({
      id: p.id,
      colorIndex: p.colorIndex,
      name: p.name,
      x: p.x,
      y: p.y,
      heading: p.heading,
      alive: p.alive,
      score: p.score,
      pts: trailPoints(p),
    })),
  };
}

/** Per-player count of trail segments already broadcast (host keeps this). */
export type SentLengths = Record<string, number>;

/** Build a delta with only the trail points added since `sent`, and return the
 *  updated `sent` counts. */
export function buildDelta(
  state: GameState,
  sent: SentLengths,
): { msg: DeltaMsg; sent: SentLengths } {
  const nextSent: SentLengths = { ...sent };
  const players: NetPlayerDelta[] = state.players.map((p) => {
    const from = sent[p.id] ?? 0;
    const np: number[] = [];
    for (let i = from; i < p.trail.length; i++) np.push(p.trail[i].bx, p.trail[i].by);
    nextSent[p.id] = p.trail.length;
    return { id: p.id, x: p.x, y: p.y, heading: p.heading, alive: p.alive, score: p.score, np };
  });
  return {
    msg: {
      t: 'delta',
      tick: state.tick,
      status: state.status,
      countdown: state.countdown,
      roundWinnerId: state.roundWinnerId,
      matchWinnerId: state.matchWinnerId,
      players,
    },
    sent: nextSent,
  };
}

// ---- client side ----

export interface ClientPlayer {
  id: string;
  colorIndex: number;
  name: string;
  x: number;
  y: number;
  heading: number;
  alive: boolean;
  score: number;
  trail: TrailSegment[];
  /** Last polyline point, for appending new ones from deltas. */
  lastX: number;
  lastY: number;
}

/** Reconstructed, renderable view of the host's game (satisfies RenderState). */
export interface ClientState extends RenderState {
  config: { lineThickness: number; targetScore: number };
  arenaWidth: number;
  arenaHeight: number;
  tickRate: number;
  targetScore: number;
  status: RoundStatus;
  countdown: number;
  tick: number;
  roundWinnerId: string | null;
  matchWinnerId: string | null;
  players: ClientPlayer[];
}

function segmentsFromPoints(pts: number[]): { trail: TrailSegment[]; lastX: number; lastY: number } {
  const trail: TrailSegment[] = [];
  const count = pts.length / 2;
  for (let i = 0; i < count - 1; i++) {
    trail.push({ ax: pts[2 * i], ay: pts[2 * i + 1], bx: pts[2 * i + 2], by: pts[2 * i + 3] });
  }
  const lastX = count > 0 ? pts[2 * (count - 1)] : 0;
  const lastY = count > 0 ? pts[2 * (count - 1) + 1] : 0;
  return { trail, lastX, lastY };
}

export function applyReset(msg: ResetMsg): ClientState {
  return {
    config: { lineThickness: msg.lineThickness, targetScore: msg.targetScore },
    arenaWidth: msg.arenaWidth,
    arenaHeight: msg.arenaHeight,
    tickRate: msg.tickRate,
    targetScore: msg.targetScore,
    status: msg.status,
    countdown: msg.countdown,
    tick: msg.tick,
    roundWinnerId: msg.roundWinnerId,
    matchWinnerId: msg.matchWinnerId,
    players: msg.players.map((p) => {
      const { trail, lastX, lastY } = segmentsFromPoints(p.pts);
      return {
        id: p.id,
        colorIndex: p.colorIndex,
        name: p.name,
        x: p.x,
        y: p.y,
        heading: p.heading,
        alive: p.alive,
        score: p.score,
        trail,
        lastX,
        lastY,
      };
    }),
  };
}

/** Apply a delta in place; ignores deltas for players not in the state. */
export function applyDelta(state: ClientState, msg: DeltaMsg): void {
  state.status = msg.status;
  state.countdown = msg.countdown;
  state.tick = msg.tick;
  state.roundWinnerId = msg.roundWinnerId;
  state.matchWinnerId = msg.matchWinnerId;
  for (const d of msg.players) {
    const cp = state.players.find((p) => p.id === d.id);
    if (!cp) continue;
    cp.x = d.x;
    cp.y = d.y;
    cp.heading = d.heading;
    cp.alive = d.alive;
    cp.score = d.score;
    for (let i = 0; i < d.np.length; i += 2) {
      const nx = d.np[i];
      const ny = d.np[i + 1];
      cp.trail.push({ ax: cp.lastX, ay: cp.lastY, bx: nx, by: ny });
      cp.lastX = nx;
      cp.lastY = ny;
    }
  }
}
