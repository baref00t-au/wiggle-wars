// Phase 2 "ghost test": drive a single line with the keyboard to eyeball that
// movement, turning, trails, and wall death all look right. This wiring is
// temporary — the real menus and multi-player setup arrive in Phase 3.

import { createInitialState, makeConfig, resetRound } from './sim/simulation';
import type { GameState, PlayerSpec } from './sim/types';
import { Renderer } from './render/renderer';
import { LocalKeyboardInput } from './input/localKeyboardInput';
import { GameLoop } from './modes/gameLoop';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app container is missing');

app.innerHTML = `
  <canvas id="game"></canvas>
  <div id="hint" class="hint"></div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const hint = document.querySelector<HTMLDivElement>('#hint');
if (!canvas || !hint) throw new Error('game canvas/hint missing');

const config = makeConfig();
const specs: PlayerSpec[] = [{ id: 'p1', colorIndex: 0, name: 'Blue' }];

let seed = 1;
const initial = createInitialState(config, specs, seed);

const renderer = new Renderer(canvas, config.arenaWidth, config.arenaHeight);
const input = new LocalKeyboardInput([
  { playerId: 'p1', left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd'] },
]);

function updateHint(state: GameState): void {
  if (state.status === 'countdown') {
    const secs = Math.ceil(state.countdown / state.config.tickRate);
    hint!.textContent = `Get ready… ${secs}`;
  } else if (state.status === 'roundOver') {
    hint!.textContent = 'Crashed! Press R or Space to go again';
  } else {
    hint!.textContent = 'Steer:  ← →   or   A D';
  }
}

const loop = new GameLoop({ initialState: initial, input, renderer, onRender: updateHint });

function fit(): void {
  renderer.resize();
}
window.addEventListener('resize', fit);
fit();
loop.start();

// Restart with R, or Space once the round is over.
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'r' || (key === ' ' && loop.getState().status === 'roundOver')) {
    seed += 1;
    loop.setState(resetRound(loop.getState(), seed));
  }
});
