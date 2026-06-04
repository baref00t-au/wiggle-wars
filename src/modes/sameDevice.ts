import { createInitialState, makeConfig, resetRound } from '../sim/simulation';
import type { GameState } from '../sim/types';
import { Renderer } from '../render/renderer';
import { colorFor } from '../render/colors';
import { DEFAULT_BINDINGS, LocalKeyboardInput } from '../input/localKeyboardInput';
import { LocalTouchInput } from '../input/localTouchInput';
import { MergedInput } from '../input/mergedInput';
import { AiInput } from '../ai/aiInput';
import { GameLoop } from './gameLoop';
import { Hud } from '../ui/hud';
import { el } from '../ui/dom';
import type { MatchSetup } from '../ui/menu';
import type { Sfx } from '../audio/sfx';

type Phase = 'running' | 'roundOver' | 'matchOver';

/** How long after a round ends before a tap counts as "next round" — lets the
 *  death effect play and avoids the crashing tap skipping the result screen. */
const ADVANCE_DELAY_MS = 800;
const GO_FLASH_MS = 600;

/**
 * Drives a full same-device match: wires the shared simulation to the renderer,
 * keyboard + touch input, HUD, and sound, and runs the round → match loop.
 * This is the only place that knows it's "local play"; the sim and renderer stay
 * mode-agnostic.
 */
export class SameDeviceMode {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private hud: Hud;
  private keyboard: LocalKeyboardInput;
  private touch: LocalTouchInput;
  private ai: AiInput;
  private input: MergedInput;
  private loop: GameLoop;
  private aiIds: Set<string>;

  private seed: number;
  private phase: Phase = 'running';
  private roundEndHandled = false;
  private advanceReadyAt = 0;
  private goUntil = 0;
  private lastCountSec = -1;
  private prevAlive = new Set<string>();
  private prevStatus: GameState['status'] = 'countdown';

  constructor(
    private container: HTMLElement,
    private setup: MatchSetup,
    private sfx: Sfx,
    private onExit: () => void,
  ) {
    this.seed = 1 + setup.players.length;

    this.canvas = el('canvas', 'game');
    this.canvas.id = 'game';
    container.append(this.canvas);

    const config = this.config();
    const state = createInitialState(config, this.specs(), this.seed);

    this.renderer = new Renderer(this.canvas, state.config.arenaWidth, state.config.arenaHeight);
    this.hud = new Hud(container);

    const humans = setup.players.filter((p) => !p.isAi);
    const bots = setup.players.filter((p) => p.isAi);
    this.aiIds = new Set(bots.map((p) => p.id));

    const humanIds = new Set(humans.map((p) => p.id));
    this.keyboard = new LocalKeyboardInput(DEFAULT_BINDINGS.filter((b) => humanIds.has(b.playerId)));
    this.touch = new LocalTouchInput(
      container,
      humans.map((p) => ({ id: p.id, colorIndex: p.colorIndex, name: p.name })),
    );
    this.ai = new AiInput(bots.map((p) => p.id), config);
    this.input = new MergedInput([this.keyboard, this.touch, this.ai]);

    this.loop = new GameLoop({
      initialState: state,
      input: this.input,
      renderer: this.renderer,
      onRender: (s) => this.onRender(s),
    });

    this.prevAlive = new Set(state.players.map((p) => p.id));
  }

  start(): void {
    this.fit();
    window.addEventListener('resize', this.fit);
    document.addEventListener('keydown', this.onKey);
    this.container.addEventListener('pointerdown', this.onPointer);
    this.loop.start();

    // Dev-only handle for headless verification; stripped from production builds.
    const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (dev) (window as unknown as { wiggle?: unknown }).wiggle = { loop: this.loop, mode: this };
  }

  dispose(): void {
    this.loop.stop();
    window.removeEventListener('resize', this.fit);
    document.removeEventListener('keydown', this.onKey);
    this.container.removeEventListener('pointerdown', this.onPointer);
    this.input.dispose();
    this.hud.dispose();
    this.canvas.remove();
  }

  private config() {
    return makeConfig({ targetScore: this.setup.targetScore });
  }

  private specs() {
    return this.setup.players.map((p) => ({ id: p.id, colorIndex: p.colorIndex, name: p.name }));
  }

  private fit = (): void => this.renderer.resize();

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (this.tryAdvance()) e.preventDefault();
    }
  };

  private onPointer = (): void => {
    // Touch zones are hidden when not playing, so a tap here means "continue".
    this.tryAdvance();
  };

  private tryAdvance(): boolean {
    if (this.phase === 'roundOver' && performance.now() >= this.advanceReadyAt) {
      this.nextRound();
      return true;
    }
    return false;
  }

  private nextRound(): void {
    this.seed += 1;
    this.loop.setState(resetRound(this.loop.getState(), this.seed));
    this.enterRunning();
  }

  private rematch(): void {
    this.seed += 1;
    this.loop.setState(createInitialState(this.config(), this.specs(), this.seed));
    this.enterRunning();
  }

  private enterRunning(): void {
    this.phase = 'running';
    this.roundEndHandled = false;
    this.lastCountSec = -1;
    this.prevStatus = 'countdown';
    this.prevAlive = new Set(this.loop.getState().players.map((p) => p.id));
    this.hud.clearCentre();
    this.touch.setVisible(true);
  }

  private onRender(state: GameState): void {
    this.hud.renderScores(state, this.aiIds);

    // Death sounds: anyone alive last frame but not now.
    const aliveNow = new Set(state.players.filter((p) => p.alive).map((p) => p.id));
    for (const id of this.prevAlive) if (!aliveNow.has(id)) this.sfx.play('death');
    this.prevAlive = aliveNow;

    const now = performance.now();

    if (state.status === 'countdown') {
      const secs = Math.ceil(state.countdown / state.config.tickRate);
      if (secs !== this.lastCountSec) {
        this.lastCountSec = secs;
        if (secs > 0) this.sfx.play('count');
      }
      this.hud.showCountdown(secs);
    } else if (state.status === 'playing') {
      if (this.prevStatus === 'countdown') {
        this.sfx.play('go');
        this.goUntil = now + GO_FLASH_MS;
      }
      if (now < this.goUntil) this.hud.showGo();
      else this.hud.clearCentre();
    } else {
      // roundOver — handle the transition once.
      if (!this.roundEndHandled) {
        this.roundEndHandled = true;
        this.advanceReadyAt = now + ADVANCE_DELAY_MS;
        this.touch.setVisible(false);
        if (state.matchWinnerId) {
          this.phase = 'matchOver';
          this.sfx.play('matchWin');
          this.showMatchOver(state);
        } else {
          this.phase = 'roundOver';
          this.sfx.play('roundWin');
          this.showRoundOver(state);
        }
      }
    }

    this.prevStatus = state.status;
  }

  private showRoundOver(state: GameState): void {
    const winner = state.players.find((p) => p.id === state.roundWinnerId);
    this.hud.showMessage({
      title: winner ? `${winner.name} wins the round!` : 'Draw!',
      titleColor: winner ? colorFor(winner.colorIndex).head : undefined,
      subtitle: 'Tap or press Space for the next round',
    });
  }

  private showMatchOver(state: GameState): void {
    const winner = state.players.find((p) => p.id === state.matchWinnerId);
    this.hud.showMessage({
      title: winner ? `${winner.name} wins the match!` : 'Game over',
      titleColor: winner ? colorFor(winner.colorIndex).head : undefined,
      celebrate: true,
      buttons: [
        { label: 'Play again', primary: true, onClick: () => this.rematch() },
        {
          label: 'New game',
          onClick: () => {
            this.dispose();
            this.onExit();
          },
        },
      ],
    });
  }
}
