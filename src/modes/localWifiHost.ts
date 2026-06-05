import { createInitialState, makeConfig, resetRound } from '../sim/simulation';
import type { GameState, PlayerSpec } from '../sim/types';
import { Renderer } from '../render/renderer';
import { colorFor } from '../render/colors';
import { LocalKeyboardInput } from '../input/localKeyboardInput';
import { LocalTouchInput } from '../input/localTouchInput';
import { MergedInput } from '../input/mergedInput';
import { NetworkInput } from '../input/networkInput';
import { GameLoop } from './gameLoop';
import { Hud } from '../ui/hud';
import { el } from '../ui/dom';
import { loadSettings } from '../settings';
import type { Sfx } from '../audio/sfx';
import type { NetHost } from '../net/host';
import { buildDelta, buildReset, type SentLengths } from '../net/protocol';

/** One player in a same-WiFi match. The host's own player has no connId. */
export interface WifiPlayer {
  playerId: string;
  colorIndex: number;
  name: string;
  connId?: string;
}

const BROADCAST_EVERY = 2; // frames between deltas (~30 Hz at 60 fps)
const ADVANCE_DELAY_MS = 800;
const GO_FLASH_MS = 600;

/**
 * The Phase 4 host: authoritative simulation on this device, broadcast to clients.
 * Reuses the exact same sim/renderer/loop as local play — the only additions are a
 * NetworkInput for the remote players and broadcasting state each tick. The host
 * controls round pacing (tap/Space), just like same-device play.
 */
export class LocalWifiHost {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private hud: Hud;
  private keyboard: LocalKeyboardInput;
  private touch: LocalTouchInput;
  private netInput = new NetworkInput();
  private loop: GameLoop;

  private connToPlayer = new Map<string, string>();
  private seed: number;
  private sent: SentLengths = {};
  private frame = 0;
  private phase: 'running' | 'roundOver' | 'matchOver' = 'running';
  private roundEndHandled = false;
  private advanceReadyAt = 0;
  private goUntil = 0;
  private lastCountSec = -1;
  private prevAlive = new Set<string>();
  private prevStatus: GameState['status'] = 'countdown';
  private disposed = false;
  private wasFullscreen = false;

  constructor(
    private container: HTMLElement,
    private netHost: NetHost,
    private players: WifiPlayer[],
    private sfx: Sfx,
    private onExit: () => void,
  ) {
    this.seed = 1 + Math.floor(Math.random() * 0x7fffffff);
    for (const p of players) if (p.connId) this.connToPlayer.set(p.connId, p.playerId);

    this.canvas = el('canvas', 'game');
    this.canvas.id = 'game';
    container.append(this.canvas);

    const settings = loadSettings();
    const config = makeConfig({
      targetScore: settings.targetScore,
      speed: settings.speed,
      turnRate: settings.speed / settings.turnRadius,
    });
    const specs: PlayerSpec[] = players.map((p) => ({ id: p.playerId, colorIndex: p.colorIndex, name: p.name }));
    const state = createInitialState(config, specs, this.seed);

    this.renderer = new Renderer(this.canvas, config.arenaWidth, config.arenaHeight);
    this.hud = new Hud(container);

    // The host's own player (the first one) gets local controls; the rest are remote.
    const local = players[0];
    this.keyboard = new LocalKeyboardInput([
      { playerId: local.playerId, left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd'] },
    ]);
    this.touch = new LocalTouchInput(container, [
      { id: local.playerId, colorIndex: local.colorIndex, name: local.name },
    ]);

    const input = new MergedInput([this.keyboard, this.touch, this.netInput]);
    this.loop = new GameLoop({ initialState: state, input, renderer: this.renderer, onRender: (s) => this.onRender(s) });
    this.prevAlive = new Set(state.players.map((p) => p.id));

    this.netHost.setHandlers({
      onInput: (connId, turn) => {
        const pid = this.connToPlayer.get(connId);
        if (pid) this.netInput.setTurn(pid, turn);
      },
      onLeave: (connId) => this.handleLeave(connId),
      onJoin: (connId) => this.netHost.sendTo(connId, buildReset(this.loop.getState())),
    });
  }

  start(): void {
    this.fit();
    window.addEventListener('resize', this.fit);
    document.addEventListener('keydown', this.onKey);
    this.container.addEventListener('pointerdown', this.onPointer);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    const root = document.documentElement;
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});

    // Tell each client its player, then send the opening snapshot.
    for (const p of this.players) {
      if (p.connId) this.netHost.sendTo(p.connId, { t: 'welcome', playerId: p.playerId });
    }
    this.broadcastReset(this.loop.getState());

    this.loop.start();
    const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (dev) (window as unknown as { wiggleHost?: unknown }).wiggleHost = { loop: this.loop, mode: this };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.netHost.broadcast({ t: 'end', reason: 'Host left the game.' });
    } catch {
      /* ignore */
    }
    this.netHost.close();
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    this.loop.stop();
    window.removeEventListener('resize', this.fit);
    document.removeEventListener('keydown', this.onKey);
    this.container.removeEventListener('pointerdown', this.onPointer);
    this.keyboard.dispose();
    this.touch.dispose();
    this.hud.dispose();
    this.canvas.remove();
  }

  private quit(): void {
    if (this.disposed) return;
    this.dispose();
    this.onExit();
  }

  private fit = (): void => this.renderer.resize();

  private onFullscreenChange = (): void => {
    const isFs = document.fullscreenElement !== null;
    if (this.wasFullscreen && !isFs) this.quit();
    this.wasFullscreen = isFs;
  };

  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.quit();
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (this.tryAdvance()) e.preventDefault();
    }
  };

  private onPointer = (): void => {
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
    const next = resetRound(this.loop.getState(), this.seed);
    this.loop.setState(next);
    this.phase = 'running';
    this.roundEndHandled = false;
    this.lastCountSec = -1;
    this.prevStatus = 'countdown';
    this.prevAlive = new Set(next.players.map((p) => p.id));
    this.hud.clearCentre();
    this.touch.setVisible(true);
    this.broadcastReset(next);
  }

  private handleLeave(connId: string): void {
    const pid = this.connToPlayer.get(connId);
    this.connToPlayer.delete(connId);
    if (!pid) return;
    this.netInput.remove(pid);
    const st = this.loop.getState();
    const p = st.players.find((x) => x.id === pid);
    if (p && p.alive) {
      p.alive = false;
      p.diedAtTick = st.tick;
    }
  }

  private broadcastReset(state: GameState): void {
    const reset = buildReset(state);
    this.netHost.broadcast(reset);
    this.sent = {};
    for (const p of state.players) this.sent[p.id] = p.trail.length;
    this.frame = 0;
  }

  private onRender(state: GameState): void {
    this.hud.renderScores(state);

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
    } else if (!this.roundEndHandled) {
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
    this.prevStatus = state.status;

    // Broadcast a compact delta a few times a second.
    if (++this.frame % BROADCAST_EVERY === 0) {
      const out = buildDelta(state, this.sent);
      this.sent = out.sent;
      this.netHost.broadcast(out.msg);
    }
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
      buttons: [{ label: 'Back to menu', primary: true, onClick: () => this.quit() }],
    });
  }
}
