import { step } from '../sim/simulation';
import type { GameState } from '../sim/types';
import type { InputSource } from '../input/inputSource';
import type { Renderer } from '../render/renderer';

export interface GameLoopOptions {
  initialState: GameState;
  input: InputSource;
  renderer: Renderer;
  /** Called once per rendered frame, after drawing — handy for HUD updates. */
  onRender?: (state: GameState) => void;
}

/** Clamp a single frame's elapsed time so a backgrounded tab can't trigger a
 *  "spiral of death" by accumulating thousands of catch-up ticks at once. */
const MAX_FRAME_MS = 250;

/**
 * Fixed-timestep loop. The simulation advances in discrete ticks via an
 * accumulator, decoupled from the display refresh rate, so behaviour is
 * reproducible regardless of frame rate — a prerequisite for networking later.
 * Rendering happens once per requestAnimationFrame.
 */
export class GameLoop {
  private state: GameState;
  private readonly input: InputSource;
  private readonly renderer: Renderer;
  private readonly onRender?: (state: GameState) => void;
  private readonly stepMs: number;

  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  constructor(opts: GameLoopOptions) {
    this.state = opts.initialState;
    this.input = opts.input;
    this.renderer = opts.renderer;
    this.onRender = opts.onRender;
    this.stepMs = 1000 / this.state.config.tickRate;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.advance(0); // paint an immediate first frame; don't wait for rAF
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  getState(): GameState {
    return this.state;
  }

  /** Replace the simulation state (e.g. to start a new round). */
  setState(state: GameState): void {
    this.state = state;
    this.accumulator = 0;
  }

  /**
   * Advance by a measured elapsed time: run as many fixed sim ticks as the
   * accumulator allows, then render once. Public so it can be driven manually
   * (e.g. headless verification) instead of only by requestAnimationFrame.
   */
  advance(elapsedMs: number): void {
    const elapsed = Math.min(elapsedMs, MAX_FRAME_MS);
    this.accumulator += elapsed;

    // Sample input once per frame; held steering is constant between frames.
    const inputs = this.input.getInputs();
    while (this.accumulator >= this.stepMs) {
      this.state = step(this.state, inputs);
      this.accumulator -= this.stepMs;
    }

    this.renderer.draw(this.state);
    this.onRender?.(this.state);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    if (this.lastTime === 0) this.lastTime = now;
    const elapsed = now - this.lastTime;
    this.lastTime = now;
    this.advance(elapsed);
    this.rafId = requestAnimationFrame(this.frame);
  };
}
