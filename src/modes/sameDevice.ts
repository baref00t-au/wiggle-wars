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
import { store } from '../learn/store';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

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
  private humanIds: Set<string>;
  private disposed = false;
  private wasFullscreen = false;
  /** Rounds finished this match (read by the app for the post-session reflection). */
  roundsPlayed = 0;

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
    // Random starting seed so every match spawns differently. The mode (unlike
    // the sim) may use Math.random; the sim stays deterministic for this seed.
    this.seed = 1 + Math.floor(Math.random() * 0x7fffffff);

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
    this.humanIds = new Set(humans.map((p) => p.id));

    const humanIds = new Set(humans.map((p) => p.id));
    this.keyboard = new LocalKeyboardInput(DEFAULT_BINDINGS.filter((b) => humanIds.has(b.playerId)));
    this.touch = new LocalTouchInput(
      container,
      humans.map((p) => ({ id: p.id, colorIndex: p.colorIndex, name: p.name })),
    );
    this.ai = new AiInput(bots.map((p) => p.id), config, setup.difficulty);
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
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    this.container.addEventListener('pointerdown', this.onPointer);

    // Go fullscreen for distraction-free play (best-effort; the Start click is the
    // user gesture browsers require). Leaving fullscreen — via Esc or a device
    // gesture — returns to the menu (see onFullscreenChange), so Esc still "gets
    // you out" and touch users have a way back too.
    const root = document.documentElement;
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});

    this.loop.start();

    // Dev-only handle for headless verification; stripped from production builds.
    const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (dev) (window as unknown as { wiggle?: unknown }).wiggle = { loop: this.loop, mode: this };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    // Remove the fullscreen listener BEFORE exiting, so our own exit doesn't
    // bounce back through onFullscreenChange.
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    this.loop.stop();
    window.removeEventListener('resize', this.fit);
    document.removeEventListener('keydown', this.onKey);
    this.container.removeEventListener('pointerdown', this.onPointer);
    this.input.dispose();
    this.hud.dispose();
    this.canvas.remove();
  }

  /** Return to the menu (idempotent). Exits fullscreen as part of dispose(). */
  private quit(): void {
    if (this.disposed) return;
    this.dispose();
    this.onExit();
  }

  private onFullscreenChange = (): void => {
    const isFs = document.fullscreenElement !== null;
    if (this.wasFullscreen && !isFs) this.quit(); // user left fullscreen → menu
    this.wasFullscreen = isFs;
  };

  private config() {
    return makeConfig({ targetScore: this.setup.targetScore });
  }

  private specs() {
    return this.setup.players.map((p) => ({ id: p.id, colorIndex: p.colorIndex, name: p.name }));
  }

  private fit = (): void => this.renderer.resize();

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.quit();
      return;
    }
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
        this.roundsPlayed += 1;
        this.recordSurvival(state);

        // Auto difficulty: rubber-band toward the human's level each round.
        let adaptNote: string | undefined;
        if (this.ai.isAdaptive) {
          const humanLife = this.bestLife(this.humanIds, state);
          const botLife = this.bestLife(this.aiIds, state);
          if (humanLife !== botLife) {
            const dir = this.ai.nudgeSkill(humanLife > botLife);
            if (dir === 'up') adaptNote = 'The bots are getting tougher!';
            else if (dir === 'down') adaptNote = 'The bots eased off a little.';
          }
        }

        if (state.matchWinnerId) {
          this.phase = 'matchOver';
          this.sfx.play('matchWin');
          this.showMatchOver(state);
        } else {
          this.phase = 'roundOver';
          this.sfx.play('roundWin');
          this.showRoundOver(state, adaptNote);
        }
      }
    }

    this.prevStatus = state.status;
  }

  private showRoundOver(state: GameState, note?: string): void {
    const winner = state.players.find((p) => p.id === state.roundWinnerId);
    this.hud.showMessage({
      title: winner ? `${winner.name} wins the round!` : 'Draw!',
      titleColor: winner ? colorFor(winner.colorIndex).head : undefined,
      subtitle: note
        ? `${note} · Tap or Space to continue`
        : 'Tap or press Space for the next round',
    });
  }

  /** Longest-lived player among `ids` this round (Infinity if one survived). */
  private bestLife(ids: Set<string>, state: GameState): number {
    let best = -1;
    for (const p of state.players) {
      if (!ids.has(p.id)) continue;
      const life = p.alive ? Number.POSITIVE_INFINITY : p.diedAtTick ?? 0;
      if (life > best) best = life;
    }
    return best;
  }

  /** Local-only mastery feedback: remember the human's longest survival today.
   *  Compared only to the player's own past on this device — never to others. */
  private recordSurvival(state: GameState): void {
    let best = 0;
    for (const p of state.players) {
      if (!this.humanIds.has(p.id)) continue;
      const ticks = p.alive ? state.tick : p.diedAtTick ?? 0;
      if (ticks > best) best = ticks;
    }
    if (best <= 0) return;
    const day = todayKey();
    const cur = store.skill();
    if (!cur || cur.day !== day || best > cur.bestTicksToday) {
      store.setSkill({ day, bestTicksToday: Math.max(best, cur && cur.day === day ? cur.bestTicksToday : 0) });
    }
  }

  private showMatchOver(state: GameState): void {
    const winner = state.players.find((p) => p.id === state.matchWinnerId);
    const skill = store.skill();
    const secs = skill && skill.day === todayKey() ? skill.bestTicksToday / state.config.tickRate : 0;
    this.hud.showMessage({
      title: winner ? `${winner.name} wins the match!` : 'Game over',
      titleColor: winner ? colorFor(winner.colorIndex).head : undefined,
      subtitle: secs > 0 ? `🏅 Your longest survival today: ${secs.toFixed(1)}s` : undefined,
      celebrate: true,
      buttons: [
        { label: 'Play again', primary: true, onClick: () => this.rematch() },
        { label: 'New game', onClick: () => this.quit() },
      ],
    });
  }
}
