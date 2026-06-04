import { el, type Back, type Cleanup } from './kit';

// 3.4 Fun vs. Can't-Stop — gentle self-awareness. Guardrail: never frame games as
// bad or shameful, never use fear, store nothing. The goal is vocabulary + agency.

export function renderFunVsCantStop(host: HTMLElement, back: Back): Cleanup {
  let step = 0;

  function topBar(): HTMLElement {
    return el('h2', 'learn-h2', '💚 Fun vs. Can’t-Stop');
  }

  function info(title: string, lines: string[]): HTMLElement {
    const card = el('div', 'learn-slide');
    card.append(el('h2', 'learn-trick-title', title));
    for (const line of lines) card.append(el('p', 'learn-body', line));
    return card;
  }

  function reflection(): HTMLElement {
    const card = el('div', 'learn-slide');
    card.append(el('h2', 'learn-trick-title', 'Just for you'));
    card.append(
      el('p', 'learn-body', 'When you play, is it usually…  (nothing is saved, there’s no right answer)'),
    );
    const verdict = el('div', 'quiz-verdict');
    const btns = el('div', 'quiz-btns');
    const choices: [string, string][] = [
      ['Mostly fun', 'That’s great — enjoy it! 🙂'],
      ['A bit of both', 'Totally normal. Just noticing the difference is the superpower. 💪'],
      ['Sometimes hard to stop', 'Thanks for being honest — that’s usually a trick’s doing, not you. The ideas next can help. 💚'],
    ];
    for (const [label, response] of choices) {
      const b = el('button', 'quiz-opt', label);
      b.addEventListener('click', () => {
        verdict.textContent = response;
        verdict.className = 'quiz-verdict show ok';
      });
      btns.append(b);
    }
    card.append(btns, verdict);
    return card;
  }

  const slides: (() => HTMLElement)[] = [
    () =>
      info('💚 Two feelings', [
        'Two feelings can look the same but aren’t:',
        '“This is FUN” — you’re enjoying it, and you could stop any time.',
        '“I can’t STOP” — you’re not even having much fun, but it’s hard to put down.',
      ]),
    () =>
      info('🙂 What fun feels like', [
        'Time flies because you’re enjoying it. When it ends you feel good — “that was great!” — and stopping is easy.',
      ]),
    () =>
      info('😵‍💫 What can’t-stop feels like', [
        'You keep going even when it’s not that fun. Stopping feels hard, and afterwards you might feel “meh”, not “great”.',
        'That’s usually a trick at work — not something wrong with you.',
      ]),
    reflection,
    () =>
      info('🧭 Things you can choose', [
        '• Decide how long to play BEFORE you start.',
        '• Now and then, ask: “am I having fun, or just not stopping?”',
        '• If a game ever feels like it’s controlling you, talk to an adult you trust.',
        'These are choices, not rules. Games are great — this just helps you stay the boss of your own time.',
      ]),
  ];

  function render(): void {
    host.replaceChildren();
    host.append(topBar());
    host.append(slides[step]());

    const nav = el('div', 'learn-nav');
    const b = el('button', 'btn', step === 0 ? '← Back' : '← Back');
    b.addEventListener('click', () => {
      if (step === 0) back();
      else {
        step--;
        render();
      }
    });
    const n = el('button', 'btn primary', step === slides.length - 1 ? 'Done ✓' : 'Next →');
    n.addEventListener('click', () => {
      if (step === slides.length - 1) back();
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
}
