import { PALETTE, colorFor } from '../render/colors';
import { el } from './dom';

export interface MatchSetup {
  players: { id: string; colorIndex: number; name: string }[];
  targetScore: number;
}

const COUNT_OPTIONS = [2, 3, 4];
const SCORE_OPTIONS = [3, 5, 10];
const KEY_HINTS = ['A / D', '← / →', 'J / L', 'Z / C'];

/**
 * The start screen: pick how many players, each a colour + optional nickname,
 * and the target score. No data is stored anywhere — names live only in memory
 * for this match. Returns a dispose function.
 */
export function renderMenu(
  container: HTMLElement,
  onStart: (setup: MatchSetup) => void,
): () => void {
  let count = 2;
  let targetScore = 5;
  const colorIndices = [0, 1, 2, 3];
  const names = ['', '', '', ''];

  const wrap = el('div', 'menu');
  container.append(wrap);

  function ensureDistinctColors(): void {
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let c = colorIndices[i];
      while (used.has(c)) c = (c + 1) % PALETTE.length;
      colorIndices[i] = c;
      used.add(c);
    }
  }

  function cycleColor(slot: number): void {
    const used = new Set<number>();
    for (let i = 0; i < count; i++) if (i !== slot) used.add(colorIndices[i]);
    let c = colorIndices[slot];
    for (let k = 0; k < PALETTE.length; k++) {
      c = (c + 1) % PALETTE.length;
      if (!used.has(c)) break;
    }
    colorIndices[slot] = c;
    render();
  }

  function render(): void {
    ensureDistinctColors();
    wrap.replaceChildren();

    wrap.append(el('h1', 'menu-title', 'Wiggle Wars'));
    wrap.append(
      el('p', 'menu-sub', 'Steer left or right. Don’t crash. Last one wiggling wins.'),
    );

    const countRow = el('div', 'option-row');
    countRow.append(el('span', 'option-label', 'Players'));
    for (const n of COUNT_OPTIONS) {
      const b = el('button', `pill${n === count ? ' on' : ''}`, String(n));
      b.addEventListener('click', () => {
        count = n;
        render();
      });
      countRow.append(b);
    }
    wrap.append(countRow);

    const list = el('div', 'player-list');
    for (let i = 0; i < count; i++) {
      const col = colorFor(colorIndices[i]);
      const row = el('div', 'player-row');

      const chip = el('button', 'color-chip');
      chip.style.background = col.line;
      chip.title = 'Change colour';
      chip.addEventListener('click', () => cycleColor(i));

      const input = el('input', 'name-input');
      input.type = 'text';
      input.maxLength = 12;
      input.placeholder = col.name;
      input.value = names[i];
      input.addEventListener('input', () => {
        names[i] = input.value;
      });

      row.append(chip, input, el('span', 'key-hint', KEY_HINTS[i] ?? ''));
      list.append(row);
    }
    wrap.append(list);

    const scoreRow = el('div', 'option-row');
    scoreRow.append(el('span', 'option-label', 'First to'));
    for (const sc of SCORE_OPTIONS) {
      const b = el('button', `pill${sc === targetScore ? ' on' : ''}`, String(sc));
      b.addEventListener('click', () => {
        targetScore = sc;
        render();
      });
      scoreRow.append(b);
    }
    wrap.append(scoreRow);

    const start = el('button', 'btn primary start', 'Start');
    start.addEventListener('click', () => {
      const players = [];
      for (let i = 0; i < count; i++) {
        const col = colorFor(colorIndices[i]);
        players.push({
          id: `p${i + 1}`,
          colorIndex: colorIndices[i],
          name: names[i].trim() || col.name,
        });
      }
      onStart({ players, targetScore });
    });
    wrap.append(start);

    wrap.append(
      el('p', 'menu-foot', 'Keyboard or touch · sound is off by default (top-right)'),
    );
  }

  render();
  return () => wrap.remove();
}
