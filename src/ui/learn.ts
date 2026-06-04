import { el } from './dom';
import type { ModeRenderer } from '../learn/kit';
import { renderSpotTheTricks } from '../learn/spotTheTricks';
import { renderTrickHunt } from '../learn/trickHunt';
import { renderDesignLab } from '../learn/designLab';
import { renderFunVsCantStop } from '../learn/funVsCantStop';
import { renderHowItWorks } from '../learn/howItWorks';
import { renderHonestPromise } from '../learn/honestPromise';
import { applyReducedMotion, clearAllData, store } from '../learn/store';

interface HubEntry {
  icon: string;
  title: string;
  blurb: string;
  render: ModeRenderer;
}

const ENTRIES: HubEntry[] = [
  { icon: '🔎', title: 'Spot the Tricks', blurb: 'The 11 tricks games use to keep you hooked.', render: renderSpotTheTricks },
  { icon: '🌍', title: 'Trick Hunt', blurb: 'Find the same tricks in apps, shops & videos.', render: renderTrickHunt },
  { icon: '✏️', title: 'Design Lab', blurb: 'Redesign a trick to be honest — and keep it.', render: renderDesignLab },
  { icon: '💚', title: 'Fun vs. Can’t-Stop', blurb: 'Tell enjoying a game from not being able to stop.', render: renderFunVsCantStop },
  { icon: '⚙️', title: 'How This Game Works', blurb: 'The game loop, collisions & fair randomness.', render: renderHowItWorks },
  { icon: '🤝', title: 'Our Honest Promise', blurb: 'What we chose NOT to build, and why.', render: renderHonestPromise },
];

export function renderLearn(container: HTMLElement, onExit: () => void): () => void {
  const wrap = el('div', 'learn');
  container.append(wrap);

  let cleanup: (() => void) | null = null;
  function clearMode(): void {
    if (cleanup) cleanup();
    cleanup = null;
  }

  function runMode(entry: HubEntry): void {
    clearMode();
    wrap.replaceChildren();
    const c = entry.render(wrap, showHub);
    cleanup = typeof c === 'function' ? c : null;
  }

  function prefsRow(): HTMLElement {
    const row = el('div', 'learn-prefs');
    const rm = el('button', 'btn small', `🌙 Calm motion: ${store.reducedMotion() ? 'on' : 'off'}`);
    rm.addEventListener('click', () => {
      store.setReducedMotion(!store.reducedMotion());
      showHub();
    });
    const clear = el('button', 'btn small', '🗑 Clear everything on this device');
    clear.addEventListener('click', () => {
      // Equal-weight confirm — honest, never a sneaky button.
      const box = el('div', 'clear-confirm');
      box.append(el('span', 'clear-q', 'Erase all saved designs and settings on this device?'));
      const keep = el('button', 'btn small', 'Keep it');
      keep.addEventListener('click', showHub);
      const yes = el('button', 'btn small', 'Yes, clear it');
      yes.addEventListener('click', () => {
        clearAllData();
        applyReducedMotion(false);
        showHub();
      });
      box.append(keep, yes);
      row.replaceWith(box);
    });
    row.append(rm, clear);
    return row;
  }

  function showHub(): void {
    clearMode();
    wrap.replaceChildren();
    wrap.append(el('h1', 'learn-title', '📚 Learn'));
    wrap.append(
      el('p', 'learn-lead', 'Wiggle Wars is fun — and it can teach you a few things too. Pick a topic.'),
    );
    const list = el('div', 'lesson-list');
    for (const entry of ENTRIES) {
      const b = el('button', 'lesson-btn');
      b.append(
        el('span', 'lesson-icon', entry.icon),
        el('span', 'lesson-name', entry.title),
        el('span', 'lesson-blurb', entry.blurb),
      );
      b.addEventListener('click', () => runMode(entry));
      list.append(b);
    }
    wrap.append(list);
    wrap.append(prefsRow());
    const back = el('button', 'btn', '← Menu');
    back.addEventListener('click', onExit);
    wrap.append(back);
    wrap.scrollTop = 0;
  }

  showHub();
  return () => {
    clearMode();
    wrap.remove();
  };
}
