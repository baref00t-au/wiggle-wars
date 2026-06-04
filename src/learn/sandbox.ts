import { el, type Back, type Cleanup } from './kit';
import { createInitialState, makeConfig } from '../sim/simulation';
import { Renderer } from '../render/renderer';
import { GameLoop } from '../modes/gameLoop';
import { LocalKeyboardInput } from '../input/localKeyboardInput';
import { MergedInput } from '../input/mergedInput';
import { AiInput } from '../ai/aiInput';

// 3.5 "Tweak a rule" sandbox — change one GameConfig value and immediately feel
// the effect. Reuses the real simulation, renderer, and loop. Nothing auto-starts:
// when a line crashes it simply stops; tweak a slider or press "Try again".

export function renderSandbox(host: HTMLElement, back: Back): Cleanup {
  host.replaceChildren();

  host.append(el('h2', 'learn-h2', '🎛 Tweak a rule'));
  host.append(el('p', 'learn-prompt', 'Steer with ← → (or A / D). Move a slider and watch what changes.'));

  const canvas = el('canvas', 'sandbox-canvas');
  host.append(canvas);

  let speed = 2.2;
  let turnRate = 0.045;
  let size = 1;

  const controls = el('div', 'sandbox-controls');
  function slider(label: string, min: number, max: number, step: number, value: number, onInput: (v: number) => void): void {
    const row = el('div', 'slider-row');
    row.append(el('label', 'slider-label', label));
    const input = el('input', 'slider');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener('input', () => onInput(parseFloat(input.value)));
    row.append(input);
    controls.append(row);
  }
  slider('Line speed', 1, 5, 0.1, speed, (v) => {
    speed = v;
    rebuild();
  });
  slider('Turn sharpness', 0.02, 0.1, 0.005, turnRate, (v) => {
    turnRate = v;
    rebuild();
  });
  slider('Arena size', 0.6, 1.6, 0.1, size, (v) => {
    size = v;
    rebuild();
  });
  host.append(controls);

  const navRow = el('div', 'learn-nav');
  const bk = el('button', 'btn', '← Back');
  bk.addEventListener('click', back);
  const again = el('button', 'btn primary', '↻ Try again');
  again.addEventListener('click', () => rebuild());
  navRow.append(bk, again);
  host.append(navRow);

  let loop: GameLoop | null = null;
  let input: MergedInput | null = null;
  let renderer: Renderer | null = null;
  let seed = 1;

  function rebuild(): void {
    loop?.stop();
    input?.dispose();
    seed += 1;
    const w = Math.round(1600 * size);
    const h = Math.round(900 * size);
    const config = makeConfig({
      speed,
      turnRate,
      arenaWidth: w,
      arenaHeight: h,
      countdownTicks: 30,
      targetScore: 999999,
    });
    const specs = [
      { id: 'p1', colorIndex: 0, name: 'You' },
      { id: 'p2', colorIndex: 2, name: 'Bot' },
    ];
    const state = createInitialState(config, specs, seed);
    renderer = new Renderer(canvas, w, h);
    const kb = new LocalKeyboardInput([{ playerId: 'p1', left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd'] }]);
    const ai = new AiInput(['p2'], config, 'normal');
    input = new MergedInput([kb, ai]);
    loop = new GameLoop({ initialState: state, input, renderer });
    renderer.resize();
    loop.start();
  }

  const onResize = (): void => renderer?.resize();
  window.addEventListener('resize', onResize);
  rebuild();

  return () => {
    window.removeEventListener('resize', onResize);
    loop?.stop();
    input?.dispose();
  };
}
