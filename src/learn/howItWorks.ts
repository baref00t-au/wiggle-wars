import { el, type Back, type Cleanup } from './kit';
import { renderSandbox } from './sandbox';

// 3.5 How This Game Works — a peek at the real tech, using Wiggle Wars itself as
// the example, ending in a live "tweak a rule" sandbox.

export function renderHowItWorks(host: HTMLElement, back: Back): Cleanup {
  let step = 0;
  let sub: (() => void) | null = null;
  const clearSub = (): void => {
    if (sub) sub();
    sub = null;
  };

  function topBar(): HTMLElement {
    const b = el('div', 'learn-bar');
    const btn = el('button', 'btn small', '← Back');
    btn.addEventListener('click', back);
    b.append(btn, el('h2', 'learn-h2', '⚙️ How This Game Works'));
    return b;
  }

  function info(title: string, lines: string[]): HTMLElement {
    const card = el('div', 'learn-slide');
    card.append(el('h2', 'learn-trick-title', title));
    for (const line of lines) card.append(el('p', 'learn-body', line));
    return card;
  }

  const slides: (() => HTMLElement)[] = [
    () =>
      info('⚙️ Under the hood', [
        'Wiggle Wars is also a neat example of how games and simulations really work. Here are four ideas you can see right in it.',
      ]),
    () =>
      info('🔁 The game loop & determinism', [
        'The game moves in tiny fixed steps — about 60 every second. Each step takes the current picture plus your steering and makes the next picture.',
        'Same start + same moves = exactly the same game, every time. That’s called determinism — it’s how a game can be fair and even replayed.',
      ]),
    () =>
      info('💥 Collision detection', [
        'How does it know you crashed? Every trail is made of little line segments. Each step the game checks: is your head too close to a wall, or to any segment of any trail?',
        'If yes — crash. That’s collision detection: geometry you can see and play.',
      ]),
    () =>
      info('📡 Multiplayer & one source of truth', [
        'If friends play on their own devices, who decides what’s real? One device becomes the “host” — the single source of truth — and everyone else shows what it says.',
        'That’s how separate computers agree on one shared world. It’s the heart of networking.',
      ]),
    () =>
      info('🎲 Fair randomness vs. trick randomness', [
        'Wiggle Wars uses randomness too — for where each player starts — but it’s seeded: fair, and the same seed gives the same start, so nobody’s cheated.',
        'The Surprise Machine also uses randomness — but to manipulate you. Same tool, opposite purpose. Always ask: is it used FOR me, or AGAINST me?',
      ]),
  ];

  function openSandbox(): void {
    clearSub();
    host.replaceChildren();
    const c = renderSandbox(host, render);
    sub = typeof c === 'function' ? c : null;
  }

  function render(): void {
    clearSub();
    host.replaceChildren();
    host.append(topBar());
    host.append(slides[step]());

    const last = step === slides.length - 1;
    if (last) {
      const sb = el('button', 'btn', '🎛 Open the tweak sandbox');
      sb.addEventListener('click', openSandbox);
      host.append(sb);
    }

    const nav = el('div', 'learn-nav');
    const b = el('button', 'btn', '← Back');
    b.addEventListener('click', () => {
      if (step === 0) back();
      else {
        step--;
        render();
      }
    });
    const n = el('button', 'btn primary', last ? 'Done ✓' : 'Next →');
    n.addEventListener('click', () => {
      if (last) back();
      else {
        step++;
        render();
      }
    });
    nav.append(b, n);
    host.append(nav);
    host.scrollTop = 0;
  }

  render();
  return () => clearSub();
}
