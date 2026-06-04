import { el } from './dom';

// "Spot the Trick" — an in-game digital-literacy exhibit. Each of the five common
// manipulation patterns gets a tiny, clearly-labelled FAKE demo the player can
// poke; the moment they feel the pull it freezes and names + defuses the trick.
// Nothing here rewards or tracks anything — it's a museum with labels. See
// ETHICS.md and docs/lesson-spot-the-trick.md.

interface Trick {
  title: string; // kid-friendly name
  tech: string; // the real name
  prompt: string; // "try it" line
  /** Build the interactive demo into `stage`; call `reveal` when the trick fires.
   *  May return a cleanup fn (e.g. to clear a timer) run when leaving the card. */
  build: (stage: HTMLElement, reveal: () => void) => (() => void) | void;
  why: string; // why it works on our brains
  grownUp: string; // the "grown-up reason" (business / regulation angle)
  doThis: string; // what you can do
  vsWiggle: string; // how Wiggle Wars is different
}

const TRICKS: Trick[] = [
  {
    title: 'The Surprise Machine',
    tech: 'variable rewards',
    prompt: 'Tap SPIN a few times…',
    build: (stage, reveal) => {
      let taps = 0;
      const result = el('div', 'demo-result', '🎰  ? · ? · ?');
      const btn = el('button', 'demo-big', '🎁 SPIN!');
      const misses = ['Aw, so close!', 'Almost!', 'Try again!', 'Nearly!'];
      btn.addEventListener('click', () => {
        taps++;
        const win = ((taps * 1103515245 + 12345) >>> 4) % 5 === 0; // pseudo, mostly loses
        result.textContent = win ? '✨ JACKPOT! ✨' : misses[taps % misses.length];
        result.classList.toggle('win', win);
        if (taps >= 3) {
          btn.disabled = true;
          reveal();
        }
      });
      stage.append(result, btn);
    },
    why: 'You never know when the prize will come, so you keep trying. Surprise makes our brain pay extra attention — the same reason claw machines and loot boxes are so hard to put down.',
    grownUp: 'Grown-up reason: random prizes keep people spending. Several countries now regulate or ban loot boxes for kids.',
    doThis: 'Notice the “just one more” feeling and name it: “that’s a Surprise Machine.”',
    vsWiggle: 'Wiggle Wars never gives random prizes — you win by skill, and you can see yourself getting better.',
  },
  {
    title: 'Hurry Or Miss Out',
    tech: 'artificial scarcity',
    prompt: 'Quick — the timer’s running!',
    build: (stage, reveal) => {
      let t = 10;
      const banner = el('div', 'demo-banner urgent', '⚡ LAST CHANCE — claim your FREE prize!');
      const timer = el('div', 'demo-timer', '⏰ 0:10');
      const btn = el('button', 'demo-big urgent', 'CLAIM NOW!');
      let stopped = false;
      const fire = () => {
        if (stopped) return;
        stopped = true;
        btn.disabled = true;
        reveal();
      };
      btn.addEventListener('click', fire);
      const iv = setInterval(() => {
        t -= 1;
        timer.textContent = `⏰ 0:${String(Math.max(0, t)).padStart(2, '0')}`;
        if (t <= 0) fire();
      }, 1000);
      stage.append(banner, timer, btn);
      return () => clearInterval(iv);
    },
    why: 'We hate missing out, so a ticking clock makes us rush instead of deciding calmly. The catch: the timer is usually fake — the game just made it up.',
    grownUp: 'Grown-up reason: urgency gets people to buy or play before they stop to think.',
    doThis: 'When you feel rushed, pause. Ask: “is this deadline real, or did the app invent it?”',
    vsWiggle: 'Wiggle Wars has no countdowns except the friendly “3–2–1–GO”. It’s there whenever you choose to play.',
  },
  {
    title: 'Don’t Break The Chain',
    tech: 'streaks',
    prompt: 'You’ve got a streak going…',
    build: (stage, reveal) => {
      const streak = el('div', 'demo-streak', '🔥🔥🔥🔥🔥🔥');
      const banner = el('div', 'demo-banner', 'Day 6 streak! Play today or you’ll LOSE it!');
      const btn = el('button', 'demo-big', 'Keep my streak!');
      btn.addEventListener('click', () => {
        btn.disabled = true;
        streak.textContent = '🔥 …please don’t go 🔥';
        reveal();
      });
      stage.append(streak, banner, btn);
    },
    why: 'Once you’ve built something up, losing it feels worse than never having had it. So you keep going to protect the streak — even on days you’re not really enjoying it.',
    grownUp: 'Grown-up reason: streaks turn a choice into a daily duty, so people open the app every single day.',
    doThis: 'Remember a streak is just a number the app is counting. Losing it costs you nothing real.',
    vsWiggle: 'Wiggle Wars doesn’t track how often you come back. There’s nothing to “keep up”.',
  },
  {
    title: 'Your Friends Are Watching',
    tech: 'social pressure',
    prompt: 'Ping! A notification…',
    build: (stage, reveal) => {
      const n1 = el('div', 'demo-notif', '😮 Sam just beat your high score!');
      const n2 = el('div', 'demo-notif', '👀 3 of your friends are playing right now');
      const btn = el('button', 'demo-big', 'Get back in!');
      btn.addEventListener('click', () => {
        btn.disabled = true;
        reveal();
      });
      stage.append(n1, n2, btn);
    },
    why: 'We care a lot about what friends think, so the game uses that to pull us back — even when we’d decided to stop. The messages are designed to poke our worry about being left out.',
    grownUp: 'Grown-up reason: notifications that mention friends are some of the best at getting people to reopen an app.',
    doThis: 'You decide when to play — not a notification. It’s OK to ignore it (or turn notifications off).',
    vsWiggle: 'Wiggle Wars has no accounts and sends no notifications. The fun stays with the people in the room.',
  },
  {
    title: 'The Sticky Exit',
    tech: 'quitting friction',
    prompt: 'Try to leave…',
    build: (stage, reveal) => {
      const banner = el('div', 'demo-banner', 'Wait! Are you SURE you want to leave? 😱');
      const stay = el('button', 'demo-big', '▶ KEEP PLAYING  (recommended!)');
      const leave = el('button', 'demo-tiny', 'leave');
      stay.addEventListener('click', () => {
        banner.textContent = 'See how it really doesn’t want you to go? Try the tiny “leave”.';
      });
      leave.addEventListener('click', () => {
        stay.disabled = true;
        leave.disabled = true;
        reveal();
      });
      const row = el('div', 'demo-row');
      row.append(stay, leave);
      stage.append(banner, row);
    },
    why: 'The “keep playing” button is huge and bright; the “quit” is tiny, greyed-out, and scary — and it asks twice. Making stopping harder than starting hopes you’ll just keep going.',
    grownUp: 'Grown-up reason: every extra second of play is worth money, so leaving is made deliberately awkward.',
    doThis: 'Notice when leaving feels harder than it should. You’re always allowed to just stop.',
    vsWiggle: 'Wiggle Wars has a big “☰ Menu” button and the Esc key — quitting is one easy tap, no guilt.',
  },
];

export function renderLearn(container: HTMLElement, onExit: () => void): () => void {
  const wrap = el('div', 'learn');
  container.append(wrap);

  let step = 0; // 0 = intro, 1..N = tricks, N+1 = outro
  let demoCleanup: (() => void) | null = null;

  function clearDemo(): void {
    if (demoCleanup) {
      demoCleanup();
      demoCleanup = null;
    }
  }

  function go(next: number): void {
    step = next;
    render();
  }

  function navRow(backLabel: string, nextLabel: string): HTMLElement {
    const row = el('div', 'learn-nav');
    const back = el('button', 'btn', backLabel);
    back.addEventListener('click', () => go(step - 1));
    const next = el('button', 'btn primary', nextLabel);
    next.addEventListener('click', () => go(step + 1));
    row.append(back, next);
    return row;
  }

  function renderIntro(): void {
    wrap.replaceChildren(
      el('h1', 'learn-title', '🔎 Spot the Trick'),
      el(
        'p',
        'learn-lead',
        'Some games are fun AND secretly designed to be hard to stop — those are two different things. Here are five tricks games use. Poke each one, then we’ll name it. Once you can name a trick, it stops working on you.',
      ),
    );
    const row = el('div', 'learn-nav');
    const back = el('button', 'btn', '← Menu');
    back.addEventListener('click', onExit);
    const next = el('button', 'btn primary', 'Start →');
    next.addEventListener('click', () => go(1));
    row.append(back, next);
    wrap.append(row);
  }

  function renderTrick(trick: Trick, index: number): void {
    wrap.replaceChildren();
    wrap.append(el('div', 'learn-step', `Trick ${index + 1} of ${TRICKS.length}`));
    wrap.append(el('h2', 'learn-trick-title', trick.title));
    wrap.append(el('p', 'learn-prompt', trick.prompt));

    const stage = el('div', 'demo-stage');
    wrap.append(stage);

    const reveal = el('div', 'reveal');
    reveal.append(el('div', 'reveal-head', `🔍 That’s “${trick.title}” (${trick.tech}).`));
    reveal.append(el('p', 'reveal-why', trick.why));
    reveal.append(el('p', 'reveal-grownup', trick.grownUp));
    reveal.append(el('p', 'reveal-do', `💪 What you can do: ${trick.doThis}`));
    reveal.append(el('p', 'reveal-wiggle', `✅ ${trick.vsWiggle}`));
    wrap.append(reveal);

    const result = trick.build(stage, () => reveal.classList.add('show'));
    demoCleanup = typeof result === 'function' ? result : null;

    const isLast = index === TRICKS.length - 1;
    wrap.append(navRow('← Back', isLast ? 'Done →' : 'Next trick →'));
  }

  function renderOutro(): void {
    wrap.replaceChildren(
      el('h1', 'learn-title', '🎉 You can spot all five!'),
      el(
        'p',
        'learn-lead',
        'Wiggle Wars has NONE of these tricks — and it’s still fun. So a good game doesn’t need them: the tricks aren’t there to make a game more fun, they’re there to make it harder to stop. Naming a trick is what disarms it.',
      ),
    );
    const row = el('div', 'learn-nav');
    const back = el('button', 'btn', '← Back');
    back.addEventListener('click', () => go(step - 1));
    const done = el('button', 'btn primary', 'Back to menu');
    done.addEventListener('click', onExit);
    row.append(back, done);
    wrap.append(row);
  }

  function render(): void {
    clearDemo();
    if (step <= 0) renderIntro();
    else if (step <= TRICKS.length) renderTrick(TRICKS[step - 1], step - 1);
    else renderOutro();
    wrap.scrollTop = 0;
  }

  render();
  return () => {
    clearDemo();
    wrap.remove();
  };
}
