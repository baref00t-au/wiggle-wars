import { PALETTE, colorFor } from '../render/colors';
import { el } from './dom';
import { loadSettings, patchSettings } from '../settings';

export interface MatchSetup {
  players: { id: string; colorIndex: number; name: string; isAi: boolean }[];
  targetScore: number;
}

const COUNT_OPTIONS = [2, 3, 4];
const SCORE_OPTIONS = [3, 5, 10];
const KEY_HINTS = ['A / D', '← / →', 'J / L', 'Z / C'];

/**
 * The start screen: pick how many players, each a colour + optional nickname +
 * whether it's a human or a bot (at least one human required), and the target
 * score. Settings persist locally; nicknames never do. Returns a dispose function.
 */
export function renderMenu(
  container: HTMLElement,
  onStart: (setup: MatchSetup) => void,
): () => void {
  const saved = loadSettings();
  let count = saved.count;
  let targetScore = saved.targetScore;
  const colorIndices = [...saved.colorIndices];
  const isAi = [...saved.ai];
  const names = ['', '', '', '']; // nicknames are never persisted (see settings.ts)

  const wrap = el('div', 'menu');
  container.append(wrap);

  function humanCount(): number {
    let n = 0;
    for (let i = 0; i < count; i++) if (!isAi[i]) n++;
    return n;
  }

  function ensureDistinctColors(): void {
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let c = colorIndices[i];
      while (used.has(c)) c = (c + 1) % PALETTE.length;
      colorIndices[i] = c;
      used.add(c);
    }
  }

  function ensureAtLeastOneHuman(): void {
    if (humanCount() === 0) isAi[0] = false;
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
    patchSettings({ colorIndices });
    render();
  }

  function toggleAi(slot: number): void {
    if (!isAi[slot]) {
      if (humanCount() <= 1) return; // keep at least one human
      isAi[slot] = true;
    } else {
      isAi[slot] = false;
    }
    patchSettings({ ai: isAi.slice() });
    render();
  }

  function render(): void {
    ensureDistinctColors();
    ensureAtLeastOneHuman();
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
        patchSettings({ count });
        render();
      });
      countRow.append(b);
    }
    wrap.append(countRow);

    const list = el('div', 'player-list');
    for (let i = 0; i < count; i++) {
      const col = colorFor(colorIndices[i]);
      const bot = isAi[i];
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
      input.disabled = bot;
      input.addEventListener('input', () => {
        names[i] = input.value;
      });

      const typeBtn = el('button', `type-btn ${bot ? 'ai' : 'human'}`, bot ? '🤖 Bot' : '🧑 You');
      typeBtn.title = 'Human or computer';
      typeBtn.addEventListener('click', () => toggleAi(i));

      row.append(chip, input, typeBtn, el('span', 'key-hint', bot ? 'auto' : KEY_HINTS[i]));
      list.append(row);
    }
    wrap.append(list);

    const scoreRow = el('div', 'option-row');
    scoreRow.append(el('span', 'option-label', 'First to'));
    for (const sc of SCORE_OPTIONS) {
      const b = el('button', `pill${sc === targetScore ? ' on' : ''}`, String(sc));
      b.addEventListener('click', () => {
        targetScore = sc;
        patchSettings({ targetScore });
        render();
      });
      scoreRow.append(b);
    }
    wrap.append(scoreRow);

    const start = el('button', 'btn primary start', 'Start');
    start.addEventListener('click', () => {
      patchSettings({ count, colorIndices, targetScore, ai: isAi.slice() });
      const players = [];
      for (let i = 0; i < count; i++) {
        const col = colorFor(colorIndices[i]);
        players.push({
          id: `p${i + 1}`,
          colorIndex: colorIndices[i],
          name: names[i].trim() || col.name,
          isAi: isAi[i],
        });
      }
      onStart({ players, targetScore });
    });
    wrap.append(start);

    wrap.append(
      el('p', 'menu-foot', 'Keyboard or touch · add bots with 🤖 · sound off by default (top-right)'),
    );
  }

  render();
  return () => wrap.remove();
}
