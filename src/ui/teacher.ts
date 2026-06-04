import { el } from './dom';
import type { MatchSetup } from './menu';
import { colorFor } from '../render/colors';

// §5 Teacher Mode — a facilitator screen (not an account, just a mode). Set up a
// class tournament, project it, advance rounds on your cue, pause with P. Entirely
// local: no logins, no data, no network.

const COUNT_OPTIONS = [2, 3, 4];
const SCORE_OPTIONS = [3, 5, 10];

export function renderTeacher(
  container: HTMLElement,
  onStart: (setup: MatchSetup) => void,
  onExit: () => void,
): () => void {
  let count = 4;
  let targetScore = 5;

  const wrap = el('div', 'menu teacher');
  container.append(wrap);

  function pillRow(label: string, options: number[], current: number, onPick: (n: number) => void): HTMLElement {
    const row = el('div', 'option-row');
    row.append(el('span', 'option-label', label));
    for (const n of options) {
      const b = el('button', `pill${n === current ? ' on' : ''}`, String(n));
      b.addEventListener('click', () => onPick(n));
      row.append(b);
    }
    return row;
  }

  function render(): void {
    wrap.replaceChildren();
    wrap.append(el('h1', 'menu-title', '👩‍🏫 Teacher Mode'));
    wrap.append(el('p', 'menu-sub', 'Run a class tournament on one screen — project it on the board.'));

    const card = el('div', 'teacher-privacy');
    card.append(el('span', 'teacher-lock', '🔒'));
    card.append(
      el('span', 'teacher-privacy-text', 'This game collects nothing about your students — no accounts, no data, no internet. Everything stays on this device.'),
    );
    wrap.append(card);

    wrap.append(
      pillRow('Players', COUNT_OPTIONS, count, (n) => {
        count = n;
        render();
      }),
    );
    wrap.append(
      pillRow('First to', SCORE_OPTIONS, targetScore, (s) => {
        targetScore = s;
        render();
      }),
    );

    wrap.append(
      el('p', 'teacher-hint', 'Rounds advance when you tap or press Space (your cue). Press P to pause, Esc to end.'),
    );

    const start = el('button', 'btn primary start', 'Start tournament');
    start.addEventListener('click', () => {
      const players = [];
      for (let i = 0; i < count; i++) {
        const col = colorFor(i);
        players.push({ id: `p${i + 1}`, colorIndex: i, name: col.name, isAi: false });
      }
      onStart({ players, targetScore, difficulty: 'normal', teacher: true });
    });
    wrap.append(start);

    const back = el('button', 'btn', '← Menu');
    back.addEventListener('click', onExit);
    wrap.append(back);
  }

  render();
  return () => wrap.remove();
}
