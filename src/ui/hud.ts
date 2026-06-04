import type { GameState } from '../sim/types';
import { colorFor } from '../render/colors';
import { el } from './dom';

export interface HudButton {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface HudMessage {
  title: string;
  titleColor?: string;
  subtitle?: string;
  celebrate?: boolean;
  buttons?: HudButton[];
}

/**
 * The on-screen overlay: a top scoreboard plus a centre area for the countdown,
 * round/match results, and buttons. Pure presentation — it reads state and the
 * mode's instructions, and never touches the simulation.
 */
export class Hud {
  private root: HTMLElement;
  private scoreboard: HTMLElement;
  private centre: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = el('div', 'hud');
    this.scoreboard = el('div', 'scoreboard');
    this.centre = el('div', 'centre');
    this.root.append(this.scoreboard, this.centre);
    container.append(this.root);
  }

  renderScores(state: GameState, aiIds?: Set<string>): void {
    this.scoreboard.replaceChildren();
    this.scoreboard.append(el('div', 'target', `First to ${state.config.targetScore}`));
    for (const p of state.players) {
      const col = colorFor(p.colorIndex);
      const chip = el('div', `score-chip${p.alive ? '' : ' dead'}`);
      const marker = el('span', 'dot-glyph', col.glyph);
      marker.style.color = col.line;
      chip.append(marker, el('span', 'name', p.name));
      if (aiIds?.has(p.id)) chip.append(el('span', 'ai-badge', '🤖'));
      chip.append(el('span', 'score', String(p.score)));
      this.scoreboard.append(chip);
    }
  }

  showCountdown(secs: number): void {
    this.centre.className = 'centre show countdown';
    this.centre.replaceChildren(el('div', 'big', secs > 0 ? String(secs) : 'GO!'));
  }

  showGo(): void {
    this.centre.className = 'centre show countdown';
    this.centre.replaceChildren(el('div', 'big go', 'GO!'));
  }

  showMessage(msg: HudMessage): void {
    this.centre.className = `centre show${msg.celebrate ? ' celebrate' : ''}`;
    const box = el('div', 'message');

    const title = el('div', 'title', msg.title);
    if (msg.titleColor) title.style.color = msg.titleColor;
    box.append(title);

    if (msg.subtitle) box.append(el('div', 'subtitle', msg.subtitle));

    if (msg.buttons && msg.buttons.length > 0) {
      const row = el('div', 'buttons');
      for (const b of msg.buttons) {
        const btn = el('button', `btn${b.primary ? ' primary' : ''}`, b.label);
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          b.onClick();
        });
        row.append(btn);
      }
      box.append(row);
    }

    this.centre.replaceChildren(box);
  }

  clearCentre(): void {
    this.centre.className = 'centre';
    this.centre.replaceChildren();
  }

  dispose(): void {
    this.root.remove();
  }
}
