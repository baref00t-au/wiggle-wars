import { Renderer } from '../render/renderer';
import { colorFor } from '../render/colors';
import { LocalKeyboardInput } from '../input/localKeyboardInput';
import { LocalTouchInput } from '../input/localTouchInput';
import { Hud } from '../ui/hud';
import { el } from '../ui/dom';
import { applyDelta, applyReset, type ClientState, type HostMsg, type ResetMsg } from '../net/protocol';
import type { NetClient } from '../net/client';

/**
 * The Phase 4 client view: it does NOT run the simulation. It renders the state
 * the host broadcasts (reset + deltas) and sends only its own steering. One device,
 * one player.
 */
export class LocalWifiClient {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private hud: Hud;
  private keyboard: LocalKeyboardInput;
  private touch: LocalTouchInput;
  private state: ClientState;

  private rafId = 0;
  private running = false;
  private disposed = false;
  private wasFullscreen = false;
  private lastSentTurn: -1 | 0 | 1 = 0;
  private centreKey = '';

  constructor(
    private container: HTMLElement,
    private netClient: NetClient,
    private myPlayerId: string,
    reset: ResetMsg,
    private onExit: () => void,
  ) {
    this.state = applyReset(reset);

    this.canvas = el('canvas', 'game');
    this.canvas.id = 'game';
    container.append(this.canvas);
    this.renderer = new Renderer(this.canvas, this.state.arenaWidth, this.state.arenaHeight);
    this.hud = new Hud(container);

    const me = this.state.players.find((p) => p.id === myPlayerId);
    this.keyboard = new LocalKeyboardInput([
      { playerId: myPlayerId, left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd'] },
    ]);
    this.touch = new LocalTouchInput(
      container,
      me ? [{ id: myPlayerId, colorIndex: me.colorIndex, name: me.name }] : [],
    );

    this.netClient.setHandlers({
      onMessage: (m) => this.onMessage(m),
      onClose: () => this.end('Disconnected from the host.'),
      onError: (msg) => this.end(msg),
    });
  }

  start(): void {
    this.fit();
    window.addEventListener('resize', this.fit);
    document.addEventListener('keydown', this.onKey);
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    const root = document.documentElement;
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    this.running = true;
    this.rafId = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    window.removeEventListener('resize', this.fit);
    document.removeEventListener('keydown', this.onKey);
    this.netClient.close();
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

  /** Host ended / we disconnected — show a brief notice, then back to the menu. */
  private end(reason: string): void {
    if (this.disposed) return;
    this.running = false;
    this.hud.showMessage({
      title: 'Game ended',
      subtitle: reason,
      buttons: [{ label: 'Back to menu', primary: true, onClick: () => this.quit() }],
    });
  }

  private onMessage(m: HostMsg): void {
    if (m.t === 'reset') this.state = applyReset(m);
    else if (m.t === 'delta') applyDelta(this.state, m);
    else if (m.t === 'end') this.end(m.reason);
    else if (m.t === 'welcome') this.myPlayerId = m.playerId;
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
    }
  };

  private frame = (): void => {
    if (!this.running) return;
    const s = this.state;
    this.renderer.draw(s);
    this.hud.renderScores(s);
    this.updateCentre(s);
    this.touch.setVisible(s.status === 'playing' || s.status === 'countdown');

    // Send our steering only when it changes.
    const kb = this.keyboard.getInputs();
    const tb = this.touch.getInputs();
    const kt = kb.length ? kb[0].turn : 0;
    const tt = tb.length ? tb[0].turn : 0;
    const turn: -1 | 0 | 1 = kt !== 0 ? kt : tt;
    if (turn !== this.lastSentTurn) {
      this.netClient.send({ t: 'input', turn });
      this.lastSentTurn = turn;
    }

    this.rafId = requestAnimationFrame(this.frame);
  };

  private updateCentre(s: ClientState): void {
    if (s.status === 'countdown') {
      const secs = Math.ceil(s.countdown / s.tickRate);
      const key = `cd${secs}`;
      if (key !== this.centreKey) {
        this.hud.showCountdown(secs);
        this.centreKey = key;
      }
    } else if (s.status === 'playing') {
      if (this.centreKey !== 'play') {
        this.hud.clearCentre();
        this.centreKey = 'play';
      }
    } else {
      const isMatch = !!s.matchWinnerId;
      const winnerId = s.matchWinnerId ?? s.roundWinnerId;
      const key = `over:${winnerId ?? ''}:${isMatch}`;
      if (key !== this.centreKey) {
        const winner = s.players.find((p) => p.id === winnerId);
        this.hud.showMessage({
          title: winner ? `${winner.name} wins the ${isMatch ? 'match' : 'round'}!` : isMatch ? 'Game over' : 'Draw!',
          titleColor: winner ? colorFor(winner.colorIndex).head : undefined,
          subtitle: isMatch ? 'Thanks for playing!' : 'Waiting for the host…',
          celebrate: isMatch,
        });
        this.centreKey = key;
      }
    }
  }
}
