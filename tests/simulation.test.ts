import { describe, it, expect } from 'vitest';
import {
  makeConfig,
  createInitialState,
  step,
} from '../src/sim/simulation';
import type { GameState, Input, PlayerSpec } from '../src/sim/types';

describe('determinism (the critical guarantee)', () => {
  // Run a full scripted match: random spawns, then a fixed per-tick steering
  // pattern derived purely from (tick, player) so both runs see identical inputs.
  function run(seed: number): GameState {
    const config = makeConfig({ countdownTicks: 0 });
    const specs: PlayerSpec[] = [
      { id: 'p1', colorIndex: 0 },
      { id: 'p2', colorIndex: 1 },
      { id: 'p3', colorIndex: 2 },
    ];
    let state = createInitialState(config, specs, seed);
    for (let t = 0; t < 400; t++) {
      const inputs: Input[] = state.players.map((p, i) => ({
        playerId: p.id,
        turn: (((t + i) % 3) - 1) as -1 | 0 | 1,
      }));
      state = step(state, inputs);
    }
    return state;
  }

  it('same seed + same inputs -> identical state after many ticks', () => {
    expect(run(12345)).toStrictEqual(run(12345));
  });

  it('different seeds -> different states', () => {
    expect(run(1)).not.toStrictEqual(run(2));
  });
});

describe('walls', () => {
  it('a player driven straight into a wall dies on the expected tick', () => {
    const config = makeConfig({
      countdownTicks: 0,
      arenaWidth: 200,
      arenaHeight: 200,
      targetScore: 99,
    });
    const specs: PlayerSpec[] = [
      { id: 'solo', colorIndex: 0, spawn: { x: 100, y: 100, heading: 0 } },
    ];
    let state = createInitialState(config, specs, 1);

    // Predict the death tick from the same rule the sim uses.
    const radius = config.lineThickness / 2;
    let expected = 0;
    for (let k = 1; ; k++) {
      if (100 + config.speed * k + radius >= config.arenaWidth) {
        expected = k;
        break;
      }
    }

    for (let t = 0; t < expected - 1; t++) state = step(state, []);
    expect(state.players[0].alive).toBe(true);

    state = step(state, []);
    expect(state.players[0].alive).toBe(false);
    expect(state.players[0].diedAtTick).toBe(expected);
  });
});

describe('trails', () => {
  const base = {
    countdownTicks: 0,
    arenaWidth: 1600,
    arenaHeight: 900,
    targetScore: 99,
  };

  it('a player crossing another player\'s trail dies', () => {
    const config = makeConfig(base);
    const specs: PlayerSpec[] = [
      // Lays a horizontal trail along y = 300, heading +x.
      { id: 'liner', colorIndex: 0, spawn: { x: 100, y: 300, heading: 0 } },
      // Descends through that trail near x = 108 (laid early, before arrival).
      { id: 'crosser', colorIndex: 1, spawn: { x: 108, y: 280, heading: Math.PI / 2 } },
    ];
    let state = createInitialState(config, specs, 1);
    for (let t = 0; t < 40; t++) state = step(state, []);

    const crosser = state.players.find((p) => p.id === 'crosser')!;
    const liner = state.players.find((p) => p.id === 'liner')!;
    expect(crosser.alive).toBe(false);
    expect(liner.alive).toBe(true);
  });

  it('a player that does not cross a trail survives', () => {
    const config = makeConfig(base);
    const specs: PlayerSpec[] = [
      { id: 'liner', colorIndex: 0, spawn: { x: 100, y: 300, heading: 0 } },
      // Climbs away from the trail — never reaches y = 300.
      { id: 'mover', colorIndex: 1, spawn: { x: 108, y: 280, heading: -Math.PI / 2 } },
    ];
    let state = createInitialState(config, specs, 1);
    for (let t = 0; t < 40; t++) state = step(state, []);

    expect(state.players.every((p) => p.alive)).toBe(true);
  });
});

describe('self-collision grace', () => {
  it('survives a hard turn briefly, but dies after looping into its own trail', () => {
    const config = makeConfig({ countdownTicks: 0 });
    const specs: PlayerSpec[] = [
      { id: 'spin', colorIndex: 0, spawn: { x: 800, y: 450, heading: 0 } },
    ];
    let state = createInitialState(config, specs, 1);
    const hardTurn = (s: GameState): GameState =>
      step(s, [{ playerId: 'spin', turn: 1 }]);

    for (let t = 0; t < 10; t++) state = hardTurn(state);
    expect(state.players[0].alive).toBe(true); // grace gap prevents an instant self-kill

    for (let t = 0; t < 240 && state.players[0].alive; t++) state = hardTurn(state);
    expect(state.players[0].alive).toBe(false); // a completed loop closes onto the old trail
    expect(state.players[0].diedAtTick).not.toBeNull();
  });
});

describe('head-on collisions', () => {
  it('both players die on the same tick and the round is a draw', () => {
    const config = makeConfig({ countdownTicks: 0, targetScore: 99 });
    const specs: PlayerSpec[] = [
      { id: 'a', colorIndex: 0, spawn: { x: 700, y: 450, heading: 0 } },
      { id: 'b', colorIndex: 1, spawn: { x: 760, y: 450, heading: Math.PI } },
    ];
    let state = createInitialState(config, specs, 1);
    for (let t = 0; t < 60 && state.status === 'playing'; t++) state = step(state, []);

    const a = state.players.find((p) => p.id === 'a')!;
    const b = state.players.find((p) => p.id === 'b')!;
    expect(a.alive).toBe(false);
    expect(b.alive).toBe(false);
    expect(a.diedAtTick).toBe(b.diedAtTick);
    expect(state.status).toBe('roundOver');
    expect(state.roundWinnerId).toBeNull();
  });
});
