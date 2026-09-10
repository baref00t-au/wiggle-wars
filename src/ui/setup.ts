import { PALETTE, colorFor } from '../render/colors';
import { el } from './dom';
import { loadSettings, patchSettings } from '../settings';
import type { DifficultySetting } from '../ai/aiInput';

/** Everything a same-device match needs to start. Nicknames live only here. */
export interface MatchSetup {
  players: { id: string; colorIndex: number; name: string; isAi: boolean }[];
  targetScore: number;
  difficulty: DifficultySetting;
  speed: number;
  turnRadius: number;
}

const COUNT_OPTIONS = [2, 3, 4];
const SCORE_OPTIONS = [3, 5, 10];
const SPEED_OPTIONS = [
  { label: 'Slow', value: 1.6 },
  { label: 'Normal', value: 2.2 },
  { label: 'Fast', value: 3 },
];
const RADIUS_OPTIONS = [
  { label: 'Tight', value: 32 },
  { label: 'Normal', value: 49 },
  { label: 'Wide', value: 75 },
];
const DIFFICULTY_OPTIONS: { value: DifficultySetting; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
  { value: 'auto', label: 'Auto' },
];
export const KEY_HINTS = ['1 / 3', '← / →', 'J / L', 'Z / C'];

/**
 * "Set up match": player count, per-slot colour / nickname / human-or-bot, and
 * the three match settings (plus bot difficulty when any slot is a bot). Two
 * columns that stack when narrow. Settings persist on-device; nicknames never do.
 * Returns a dispose function.
 */
export function renderSetup(
  container: HTMLElement,
  onStart: (setup: MatchSetup) => void,
  onBack: () => void,
): () => void {
  const saved = loadSettings();
  let count = saved.count;
  let targetScore = saved.targetScore;
  let difficulty = saved.difficulty;
  let speed = saved.speed;
  let turnRadius = saved.turnRadius;
  const colorIndices = [...saved.colorIndices];
  const isAi = [...saved.ai];
  const names = ['', '', '', '']; // session-only (see settings.ts)

  const wrap = el('div', 'setup');
  container.append(wrap);

  // ----- header (static) -----
  const head = el('div', 'setup-head');
  const back = el('button', 'icon-btn', '←');
  back.title = 'Back';
  back.setAttribute('aria-label', 'Back to home');
  back.addEventListener('click', onBack);
  const titles = el('div', 'setup-titles');
  titles.append(el('div', 'eyebrow', 'SET UP MATCH'), el('div', 'setup-title', 'Same device'));
  const start = el('button', 'btn-primary', 'Start ▸');
  start.addEventListener('click', () => {
    patchSettings({ count, colorIndices, targetScore, ai: isAi.slice(), difficulty, speed, turnRadius });
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
    onStart({ players, targetScore, difficulty, speed, turnRadius });
  });
  head.append(back, titles, start);

  const body = el('div', 'setup-body');
  const left = el('div', 'setup-col players');
  const right = el('div', 'setup-col settings');
  body.append(left, right);
  wrap.append(head, body);

  // ----- helpers -----
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
    renderPlayers();
  }

  function toggleAi(slot: number): void {
    if (!isAi[slot]) {
      if (humanCount() <= 1) return; // at least one human — the button just doesn't respond
      isAi[slot] = true;
    } else {
      isAi[slot] = false;
    }
    patchSettings({ ai: isAi.slice() });
    renderPlayers();
    renderSettings();
  }

  function option(label: string, on: boolean, onPick: () => void, extra = ''): HTMLButtonElement {
    const b = el('button', `opt${extra ? ` ${extra}` : ''}${on ? ' on' : ''}`, label);
    b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', onPick);
    return b;
  }

  function group<T>(
    label: string,
    options: { label: string; value: T }[],
    current: T,
    pick: (v: T) => void,
  ): HTMLElement {
    const g = el('div', 'setting-group');
    g.append(el('div', 'label', label));
    const row = el('div', 'opt-row');
    for (const o of options) row.append(option(o.label, o.value === current, () => pick(o.value)));
    g.append(row);
    return g;
  }

  // ----- left column: players -----
  function renderPlayers(): void {
    ensureDistinctColors();
    ensureAtLeastOneHuman();
    left.replaceChildren();

    const rowHead = el('div', 'setup-row-head');
    rowHead.append(el('div', 'label', 'PLAYERS'));
    const counts = el('div', 'opt-row count');
    for (const n of COUNT_OPTIONS) {
      counts.append(
        option(
          String(n),
          n === count,
          () => {
            count = n;
            patchSettings({ count });
            renderPlayers();
            renderSettings();
          },
          'count',
        ),
      );
    }
    rowHead.append(counts);
    left.append(rowHead);

    for (let i = 0; i < count; i++) {
      const col = colorFor(colorIndices[i]);
      const bot = isAi[i];
      const row = el('div', 'slot-row');

      const chip = el('button', 'color-chip', col.glyph);
      chip.style.background = col.line;
      chip.title = 'Change colour';
      chip.setAttribute('aria-label', `Colour: ${col.name}. Change colour`);
      chip.addEventListener('click', () => cycleColor(i));

      const input = el('input', 'name-field');
      input.type = 'text';
      input.maxLength = 12;
      input.placeholder = col.name;
      input.value = names[i];
      input.disabled = bot;
      input.setAttribute('aria-label', `Player ${i + 1} nickname`);
      input.addEventListener('input', () => {
        names[i] = input.value;
      });

      const kind = el('button', `kind-btn${bot ? ' bot' : ''}`, bot ? '🤖 Bot' : '🧑 You');
      kind.title = 'Human or computer';
      kind.addEventListener('click', () => toggleAi(i));

      row.append(chip, input, kind, el('span', 'key-hint', bot ? 'auto' : KEY_HINTS[i]));
      left.append(row);
    }
  }

  // ----- right column: settings -----
  function renderSettings(): void {
    right.replaceChildren();

    right.append(
      group(
        'FIRST TO',
        SCORE_OPTIONS.map((v) => ({ label: String(v), value: v })),
        targetScore,
        (v) => {
          targetScore = v;
          patchSettings({ targetScore });
          renderSettings();
        },
      ),
      group('SPEED', SPEED_OPTIONS, speed, (v) => {
        speed = v;
        patchSettings({ speed });
        renderSettings();
      }),
      group('TURN RADIUS', RADIUS_OPTIONS, turnRadius, (v) => {
        turnRadius = v;
        patchSettings({ turnRadius });
        renderSettings();
      }),
    );

    if (isAi.slice(0, count).some(Boolean)) {
      right.append(
        group('BOTS', DIFFICULTY_OPTIONS, difficulty, (v) => {
          difficulty = v;
          patchSettings({ difficulty });
          renderSettings();
        }),
      );
      if (difficulty === 'auto') {
        right.append(el('p', 'setup-hint', 'Auto adjusts the bots to how you’re doing.'));
      }
    }

    right.append(el('div', 'note-card', 'Settings stay on this device. Nicknames are never saved.'));
  }

  renderPlayers();
  renderSettings();
  return () => wrap.remove();
}
