import { describe, it, expect } from 'vitest';
import { createInitialState, makeConfig, step } from '../src/sim/simulation';
import type { Input, PlayerSpec } from '../src/sim/types';
import {
  applyDelta,
  applyReset,
  buildDelta,
  buildReset,
  type ClientState,
  type SentLengths,
} from '../src/net/protocol';

/** Mimic the wire: JSON round-trip (lossless for JS doubles). */
function wire<T>(msg: T): T {
  return JSON.parse(JSON.stringify(msg)) as T;
}

function expectClientMatchesHost(client: ClientState, host: ReturnType<typeof createInitialState>): void {
  expect(client.status).toBe(host.status);
  expect(client.tick).toBe(host.tick);
  expect(client.roundWinnerId).toBe(host.roundWinnerId);
  expect(client.matchWinnerId).toBe(host.matchWinnerId);
  for (const hp of host.players) {
    const cp = client.players.find((p) => p.id === hp.id);
    expect(cp).toBeDefined();
    expect(cp!.alive).toBe(hp.alive);
    expect(cp!.score).toBe(hp.score);
    expect(cp!.colorIndex).toBe(hp.colorIndex);
    expect(cp!.x).toBe(hp.x);
    expect(cp!.y).toBe(hp.y);
    expect(cp!.heading).toBe(hp.heading);
    expect(cp!.trail).toStrictEqual(hp.trail);
  }
}

describe('phase-4 sync protocol', () => {
  it('client reconstructs host trails/positions from reset + deltas', () => {
    const config = makeConfig({ countdownTicks: 0, targetScore: 99 });
    const specs: PlayerSpec[] = [
      { id: 'p1', colorIndex: 0, name: 'A', spawn: { x: 200, y: 450, heading: 0 } },
      { id: 'p2', colorIndex: 1, name: 'B', spawn: { x: 1400, y: 450, heading: Math.PI } },
    ];
    let host = createInitialState(config, specs, 7);

    const client = applyReset(wire(buildReset(host)));
    let sent: SentLengths = {};
    host.players.forEach((p) => (sent[p.id] = p.trail.length));

    // 120 ticks, broadcasting a delta every 3 ticks (~20 Hz vs 60 Hz sim).
    for (let t = 0; t < 120; t++) {
      const inputs: Input[] = host.players.map((p, i) => ({
        playerId: p.id,
        turn: (((t + i) % 3) - 1) as -1 | 0 | 1,
      }));
      host = step(host, inputs);
      if (t % 3 === 0) {
        const out = buildDelta(host, sent);
        sent = out.sent;
        applyDelta(client, wire(out.msg));
      }
    }
    // final flush so the client is fully caught up
    const out = buildDelta(host, sent);
    applyDelta(client, wire(out.msg));

    expectClientMatchesHost(client, host);
    // sanity: trails actually grew
    expect(host.players[0].trail.length).toBeGreaterThan(10);
  });

  it('a single reset reconstructs a mid-game state (late joiner)', () => {
    const config = makeConfig({ countdownTicks: 0, targetScore: 99 });
    const specs: PlayerSpec[] = [
      { id: 'p1', colorIndex: 0, name: 'A', spawn: { x: 300, y: 300, heading: 0.5 } },
      { id: 'p2', colorIndex: 1, name: 'B', spawn: { x: 800, y: 600, heading: 2 } },
    ];
    let host = createInitialState(config, specs, 3);
    for (let t = 0; t < 50; t++) {
      host = step(
        host,
        host.players.map((p, i) => ({ playerId: p.id, turn: ((i % 3) - 1) as -1 | 0 | 1 })),
      );
    }
    const client = applyReset(wire(buildReset(host)));
    expectClientMatchesHost(client, host);
  });
});
