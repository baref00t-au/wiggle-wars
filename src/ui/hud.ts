import { colorFor } from '../render/colors';
import { el } from './dom';

/** The minimal view the scoreboard needs — both the host GameState and a Phase 4
 *  client's reconstructed state satisfy it. */
export interface ScoreState {
  config: { targetScore: number };
  players: { id: string; colorIndex: number; name: string; alive: boolean; score: number }[];
}

export interface HudButton {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface HudMessage {
  /** Small caps line above the title ("ROUND 3", "MATCH OVER"). */
  eyebrow?: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  /** When given, a row of glyph + score chips is shown under the title. */
  scores?: ScoreState;
  /** Match-over treatment: accent border, heavier scrim, bigger title. */
  celebrate?: boolean;
  buttons?: HudButton[];
}

/**
 * The on-screen overlay: a compact score rail at the top plus a centre area for
 * the countdown and the round / match result cards. Pure presentation — it
 * reads state and the mode's instructions, and never touches the simulation.
 */
export class Hud {
  private root: HTMLElement;
  private rail: HTMLElement;
  private centre: HTMLElement;
  private lastCount: string | null = null;

  constructor(container: HTMLElement) {
    this.root = el('div', 'hud');
    this.rail = el('div', 'score-rail');
    this.centre = el('div', 'centre');
    this.root.append(this.rail, this.centre);
    container.append(this.root);
  }

  /** Glyph + score per player. Names are deliberately omitted — they sit on each
   *  player's pad — so the rail never wraps into the top pads on a phone. */
  renderScores(state: ScoreState, _aiIds?: Set<string>): void {
    this.rail.replaceChildren();
    this.rail.append(el('span', 'rail-target', `FIRST TO ${state.config.targetScore}`));
    for (const p of state.players) {
      const col = colorFor(p.colorIndex);
      const chip = el('span', `rail-chip${p.alive ? '' : ' dim'}`);
      chip.title = p.name;
      const glyph = el('span', 'glyph', col.glyph);
      glyph.style.color = col.line;
      chip.append(glyph, el('span', 'score', String(p.score)));
      this.rail.append(chip);
    }
  }

  showCountdown(secs: number): void {
    this.showCount(secs > 0 ? String(secs) : 'GO!');
  }

  showGo(): void {
    this.showCount('GO!');
  }

  /** Re-renders only when the numeral changes, so the pop animation plays once per step. */
  private showCount(text: string): void {
    if (this.centre.classList.contains('countdown') && this.lastCount === text) return;
    this.lastCount = text;
    this.centre.className = 'centre show countdown';
    this.centre.replaceChildren(el('div', 'count-num', text));
  }

  showMessage(msg: HudMessage): void {
    this.lastCount = null;
    this.centre.className = `centre show ${msg.celebrate ? 'match' : 'round'}`;
    const card = el('div', `result-card${msg.celebrate ? ' match' : ''}`);

    if (msg.eyebrow) card.append(el('div', 'eyebrow', msg.eyebrow));

    const title = el('div', 'result-title', msg.title);
    if (msg.titleColor) title.style.color = msg.titleColor;
    card.append(title);

    if (msg.subtitle) card.append(el('div', 'result-body', msg.subtitle));

    if (msg.scores) {
      const row = el('div', 'result-scores');
      for (const p of msg.scores.players) {
        const col = colorFor(p.colorIndex);
        const chip = el('span', 'result-chip');
        chip.title = p.name;
        const glyph = el('span', 'glyph', col.glyph);
        glyph.style.color = col.line;
        chip.append(glyph, el('span', 'score', String(p.score)));
        row.append(chip);
      }
      card.append(row);
    }

    if (msg.buttons && msg.buttons.length > 0) {
      const row = el('div', 'result-buttons');
      for (const b of msg.buttons) {
        const btn = el('button', b.primary ? 'btn-primary' : 'btn-secondary', b.label);
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          b.onClick();
        });
        btn.addEventListener('pointerdown', (e) => e.stopPropagation());
        row.append(btn);
      }
      card.append(row);
    }

    this.centre.replaceChildren(card);
  }

  clearCentre(): void {
    this.lastCount = null;
    this.centre.className = 'centre';
    this.centre.replaceChildren();
  }

  dispose(): void {
    this.root.remove();
  }
}
