import { el } from './dom';

// In-game "Learn" hub: short, mostly playful lessons that use Wiggle Wars as a
// teaching vehicle. Nothing here rewards or tracks anything — the dark-pattern
// demos are clearly-labelled fakes that immediately name + defuse themselves.
// See ETHICS.md and docs/lesson-spot-the-trick.md.

type Cleanup = (() => void) | void;
/** Builds one slide into `host`; may return a cleanup (e.g. clear a timer). */
type Slide = (host: HTMLElement) => Cleanup;

interface Lesson {
  icon: string;
  title: string;
  blurb: string;
  slides: Slide[];
}

interface Trick {
  title: string;
  tech: string;
  prompt: string;
  build: (stage: HTMLElement, reveal: () => void) => Cleanup;
  why: string;
  grownUp?: string;
  doThis: string;
  vsWiggle: string;
}

// ---------- slide helpers ----------

/** A plain content slide: heading + body paragraphs (+ optional extra builder). */
function infoSlide(title: string, body: string[], extra?: (host: HTMLElement) => void): Slide {
  return (host) => {
    host.append(el('h2', 'learn-trick-title', title));
    for (const line of body) host.append(el('p', 'learn-body', line));
    if (extra) extra(host);
  };
}

/** An interactive "trick" slide: poke the fake demo, then it names + defuses itself. */
function trickSlide(t: Trick): Slide {
  return (host) => {
    host.append(el('h2', 'learn-trick-title', t.title));
    host.append(el('p', 'learn-prompt', t.prompt));
    const stage = el('div', 'demo-stage');
    host.append(stage);

    const reveal = el('div', 'reveal');
    reveal.append(el('div', 'reveal-head', `🔍 That’s “${t.title}” (${t.tech}).`));
    reveal.append(el('p', 'reveal-why', t.why));
    if (t.grownUp) reveal.append(el('p', 'reveal-grownup', t.grownUp));
    reveal.append(el('p', 'reveal-do', `💪 ${t.doThis}`));
    reveal.append(el('p', 'reveal-wiggle', `✅ ${t.vsWiggle}`));
    host.append(reveal);

    return t.build(stage, () => reveal.classList.add('show'));
  };
}

// ---------- the five core tricks ----------

const CORE_TRICKS: Trick[] = [
  {
    title: 'The Surprise Machine',
    tech: 'random rewards',
    prompt: 'Tap SPIN a few times…',
    build: (stage, reveal) => {
      let taps = 0;
      const result = el('div', 'demo-result', '🎰  ? · ? · ?');
      const btn = el('button', 'demo-big', '🎁 SPIN!');
      const misses = ['Aw, so close!', 'Almost!', 'Try again!', 'Nearly!'];
      btn.addEventListener('click', () => {
        taps++;
        const win = ((taps * 1103515245 + 12345) >>> 4) % 5 === 0;
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

// ---------- six more tricks (for older players) ----------

const MORE_TRICKS: Trick[] = [
  {
    title: 'The Money Door',
    tech: 'pay-to-win / hidden costs',
    prompt: 'Losing? There’s a shortcut…',
    build: (stage, reveal) => {
      const banner = el('div', 'demo-banner', 'You keep losing to players who paid 😢');
      const btn = el('button', 'demo-big', '⭐ Buy SUPER SPEED — 💎 $4.99');
      btn.addEventListener('click', () => {
        btn.disabled = true;
        reveal();
      });
      stage.append(banner, btn);
    },
    why: 'When paying makes you win, the game stops being about skill. “Free” often just funnels you toward spending — and it’s usually a grown-up’s money.',
    grownUp: 'Grown-up reason: selling power earns far more than selling the game once.',
    doThis: 'Ask: am I being asked to pay to *win*, or just to play? Paying to win is a red flag.',
    vsWiggle: 'Wiggle Wars sells nothing and gives no one an advantage. Everyone plays the exact same game.',
  },
  {
    title: 'Too Far To Quit',
    tech: 'sunk cost',
    prompt: 'You’re almost there…',
    build: (stage, reveal) => {
      const banner = el('div', 'demo-banner', 'Level 7 — almost complete!');
      const bar = el('div', 'demo-bar');
      const fill = el('div', 'demo-bar-fill');
      fill.style.width = '90%';
      bar.append(fill);
      const pct = el('div', 'demo-timer', '90%');
      const finish = el('button', 'demo-big', 'Finish it! (≈30 more min)');
      const quit = el('button', 'demo-tiny', 'quit & lose it all');
      finish.addEventListener('click', () => {
        banner.textContent = '…funny how it never quite finishes.';
      });
      quit.addEventListener('click', () => {
        finish.disabled = quit.disabled = true;
        reveal();
      });
      const row = el('div', 'demo-row');
      row.append(finish, quit);
      stage.append(banner, bar, pct, row);
    },
    why: 'Quitting when you’re “90% there” feels like wasting all your effort, so you keep going — even past the point of fun. The bar is set up to always feel almost done.',
    grownUp: 'Grown-up reason: the “you’ve already invested so much” feeling is one of the strongest pulls there is.',
    doThis: 'Your past time is already spent either way. Decide by “am I enjoying this *now*?”, not by the bar.',
    vsWiggle: 'Wiggle Wars rounds are short and finish cleanly. There’s no half-done thing dragging you back.',
  },
  {
    title: 'Always One Step Behind',
    tech: 'manufactured comparison',
    prompt: 'Check your ranking…',
    build: (stage, reveal) => {
      const board = el('div', 'demo-notif', '🏆 You are ranked #4,812');
      const chase = el('div', 'demo-banner', 'So close! Beat #4,811 to climb!');
      const btn = el('button', 'demo-big', 'Climb the ranks!');
      btn.addEventListener('click', () => {
        btn.disabled = true;
        reveal();
      });
      stage.append(board, chase, btn);
    },
    why: 'There’s always someone just ahead, on purpose — so you feel behind and keep grinding to catch up. The ranking is built to never let you feel “done”.',
    grownUp: 'Grown-up reason: constant comparison keeps people playing to climb a ladder that has no top.',
    doThis: 'Compare you-today to you-yesterday, not to a stranger’s number designed to nag you.',
    vsWiggle: 'Wiggle Wars celebrates the round you just played with the people next to you — no global ladder.',
  },
  {
    title: 'The Constant Tap On The Shoulder',
    tech: 'notification bait',
    prompt: 'Buzz buzz…',
    build: (stage, reveal) => {
      const n1 = el('div', 'demo-notif', '🔔 We miss you! Come back and play!');
      const n2 = el('div', 'demo-notif', '🔔 Your worms are lonely without you 🥺');
      const btn = el('button', 'demo-big', 'Open the game');
      btn.addEventListener('click', () => {
        btn.disabled = true;
        reveal();
      });
      stage.append(n1, n2, btn);
    },
    why: 'These pings aren’t about anything that actually happened — they’re scheduled to interrupt you and pull you back on the app’s timetable, not yours.',
    grownUp: 'Grown-up reason: a reopened app is another chance to show ads or sell something.',
    doThis: 'Notifications are a request, not a command. Turn off the ones that just say “come back”.',
    vsWiggle: 'Wiggle Wars can’t ping you — no accounts, no notifications. You open it when *you* want to.',
  },
  {
    title: 'The Sneaky Button',
    tech: 'deceptive choices / dark patterns',
    prompt: 'Pick an option…',
    build: (stage, reveal) => {
      const q = el('div', 'demo-banner', 'Want awesome FREE stuff?');
      const yes = el('button', 'demo-big', 'YES! Send me EVERYTHING! 🎉');
      const no = el('button', 'demo-tiny', 'no thanks');
      yes.addEventListener('click', () => {
        q.textContent = '(That huge button would’ve signed you up for loads of emails.)';
      });
      no.addEventListener('click', () => {
        yes.disabled = no.disabled = true;
        reveal();
      });
      const row = el('div', 'demo-row');
      row.append(yes, no);
      stage.append(q, row);
    },
    why: 'One choice is huge and bright; the other is tiny and greyed-out — so your eye and finger go to the one *they* want. It tricks you into agreeing to things you didn’t mean to.',
    grownUp: 'Grown-up reason: nudging clicks toward “yes” boosts sign-ups and sales. It also teaches people not to read.',
    doThis: 'When one button is shouting, slow down and read the quiet one. Read before you tap.',
    vsWiggle: 'Wiggle Wars gives equal, clearly-labelled choices and never tries to trick your tap.',
  },
  {
    title: 'The Slowing Treadmill',
    tech: 'reward inflation',
    prompt: 'Play a few rounds…',
    build: (stage, reveal) => {
      let taps = 0;
      const coins = el('div', 'demo-result', '🪙 +100!');
      const btn = el('button', 'demo-big', 'Play a round');
      const amounts = ['🪙 +100!', '🪙 +20', '🪙 +5', '🪙 +1', '🪙 +1…'];
      btn.addEventListener('click', () => {
        taps++;
        coins.textContent = amounts[Math.min(taps, amounts.length - 1)];
        if (taps >= 4) {
          btn.disabled = true;
          reveal();
        }
      });
      stage.append(coins, btn);
    },
    why: 'Early on, rewards pour in and it feels great. Then they quietly shrink, so you have to play (or pay) more and more to get the same buzz. It’s a treadmill that speeds up under you.',
    grownUp: 'Grown-up reason: hook people with generosity, then make the same feeling cost more time or money.',
    doThis: 'Notice if you’re grinding harder for less fun than you used to get. That’s the treadmill.',
    vsWiggle: 'In Wiggle Wars a good move feels good the same way on round 1 and round 100. No bait-and-switch.',
  },
];

// ---------- Thread 1: Beyond Games ----------

const BEYOND_GAMES: Slide[] = [
  infoSlide('🌍 These tricks are everywhere', [
    'The tricks aren’t only in games. The very same patterns show up across your whole screen — in social apps, shops, and videos. Once you can name them, you’ll start seeing them everywhere.',
  ]),
  infoSlide('📱 Social media', [
    'Infinite scroll that never ends — that’s the same “no natural finish” as an endless game.',
    '“7 people liked your post” and “Sam tagged you” — that’s Social Pressure, pulling you back.',
  ]),
  infoSlide('🛒 Shopping apps', [
    '“Only 2 left!” and “Sale ends in 09:59” — that’s Fake Scarcity, the same ticking-clock trick, made to make you buy before you think.',
  ]),
  infoSlide('📺 Streaming', [
    'The next episode autoplaying in 5… 4… 3… — that’s a Sticky Exit. Stopping is made harder than just letting it roll on.',
  ]),
  infoSlide('🕵️ Your mission', [
    'This week, catch THREE tricks outside games — in an app, an ad, or a website. Name each one out loud.',
    'A lens you can use on the whole internet starts with the five tricks you already know.',
  ]),
];

// ---------- Thread 2: Be an Honest Designer ----------

function honestQuizSlide(): Slide {
  const items = [
    { f: 'A spinning prize wheel after every game', fun: false, why: 'Surprise Machine — random prizes to keep you spinning.' },
    { f: 'Showing your fastest time so you can beat it', fun: true, why: 'Honest — it rewards your real skill.' },
    { f: '“Play today or lose your 10-day streak!”', fun: false, why: 'Streak guilt — turns play into a duty.' },
    { f: 'A big, clear “Back to menu” button', fun: true, why: 'Honest — leaving is easy and it’s your choice.' },
    { f: '“Only 3 minutes left to play for FREE!”', fun: false, why: 'Fake scarcity — the timer is made up.' },
  ];
  return (host) => {
    host.append(el('h2', 'learn-trick-title', 'More fun, or harder to stop?'));
    host.append(el('p', 'learn-prompt', 'Tap your answer for each idea.'));
    for (const it of items) {
      const row = el('div', 'quiz-row');
      row.append(el('div', 'quiz-feature', it.f));
      const btns = el('div', 'quiz-btns');
      const fun = el('button', 'quiz-opt', '😄 More fun');
      const stop = el('button', 'quiz-opt', '🪤 Harder to stop');
      const verdict = el('div', 'quiz-verdict');
      const choose = (saidFun: boolean) => {
        const correct = saidFun === it.fun;
        verdict.textContent = `${correct ? '✓ ' : '✗ '}${it.why}`;
        verdict.className = `quiz-verdict show ${correct ? 'ok' : 'no'}`;
        fun.disabled = true;
        stop.disabled = true;
      };
      fun.addEventListener('click', () => choose(true));
      stop.addEventListener('click', () => choose(false));
      btns.append(fun, stop);
      row.append(btns, verdict);
      host.append(row);
    }
  };
}

const HONEST_DESIGNER: Slide[] = [
  infoSlide('✏️ You’re the designer', [
    'Every feature in a game was a choice someone made. There’s one simple test you can use on any of them:',
    '“Does this make the game more fun — or just harder to stop?” If it’s the second, a good designer cuts it.',
  ]),
  honestQuizSlide(),
  infoSlide('🔧 Redesign a trick', [
    'Take a trick and make it honest. Example: instead of a “daily streak” that punishes you for missing a day, show a gallery of the skills you’ve unlocked — no penalty, no pressure, just a record of getting better.',
    'Your turn: pick a trick from the lessons and redesign it to be honest.',
  ]),
  infoSlide('💰 So why do companies use the tricks?', [
    'Mostly money: more time on the app means more ads seen and more things sold. The tricks aren’t there to make the game better — they’re there to keep you on it.',
    'A good designer earns your time by being fun, instead of trapping it. That’s the responsibility.',
  ]),
];

// ---------- Thread 3: How Wiggle Wars Works (STEM) ----------

const HOW_IT_WORKS: Slide[] = [
  infoSlide('⚙️ Under the hood', [
    'Wiggle Wars is also a neat example of how games and simulations really work. Here are four ideas you can actually see in it.',
  ]),
  infoSlide('🔁 The game loop & determinism', [
    'The game moves in tiny fixed steps — about 60 every second. Each step takes the current picture plus your steering and makes the next picture.',
    'Same start + same moves = exactly the same game, every time. That’s called *determinism*, and it’s how a game can be fair and even replayed.',
  ]),
  infoSlide('💥 Collision detection', [
    'How does it know you crashed? Every trail is made of little line segments. Each step the game checks: is your head too close to a wall, or to any segment of any trail?',
    'If yes — crash. That’s *collision detection*: geometry you can see and play.',
  ]),
  infoSlide('📡 Multiplayer & one source of truth', [
    'If friends play on their own devices, who decides what’s real? One device becomes the “host” — the single source of truth — and everyone else shows what it says.',
    'That’s how separate computers agree on one shared world. It’s the heart of networking.',
  ]),
  infoSlide('🎲 Randomness vs. fairness', [
    'Wiggle Wars uses randomness too — for where each player starts — but it’s *seeded*: fair, and the same seed gives the same start, so nobody’s cheated.',
    'Notice: the Surprise Machine also uses randomness — but to manipulate you. Same tool, opposite intent. The question is always: is it used FOR you, or AGAINST you?',
  ]),
];

// ---------- the hub ----------

const LESSONS: Lesson[] = [
  {
    icon: '🔎',
    title: 'Spot the Trick',
    blurb: 'The 5 tricks games use to keep you hooked.',
    slides: [
      infoSlide('🔎 Spot the Trick', [
        'Some games are fun AND secretly designed to be hard to stop — two different things. Here are five tricks. Poke each one, then we’ll name it. Once you can name a trick, it stops working on you.',
      ]),
      ...CORE_TRICKS.map(trickSlide),
      infoSlide('🎉 You can spot all five!', [
        'Wiggle Wars has NONE of these tricks — and it’s still fun. So a good game doesn’t need them: the tricks aren’t there to make a game more fun, they’re there to make it harder to stop.',
        'Naming a trick is what disarms it.',
      ]),
    ],
  },
  {
    icon: '🕵️',
    title: 'More Tricks',
    blurb: 'Six sneakier ones, for older players.',
    slides: [
      infoSlide('🕵️ Six more tricks', [
        'Ready for the trickier ones? These show up more in big online games and apps. Same idea: poke each demo, then we name it.',
      ]),
      ...MORE_TRICKS.map(trickSlide),
      infoSlide('🧠 Now you know eleven', [
        'Surprise Machine, Hurry Or Miss Out, streaks, social pressure, sticky exits — plus money doors, sunk cost, comparison, notification bait, sneaky buttons, and the slowing treadmill.',
        'That’s most of the toolkit. You’ll spot these for the rest of your life now.',
      ]),
    ],
  },
  {
    icon: '🌍',
    title: 'Beyond Games',
    blurb: 'The same tricks in apps, shops & videos.',
    slides: BEYOND_GAMES,
  },
  {
    icon: '✏️',
    title: 'Be an Honest Designer',
    blurb: 'Spot good vs sneaky design — and fix it.',
    slides: HONEST_DESIGNER,
  },
  {
    icon: '⚙️',
    title: 'How Wiggle Wars Works',
    blurb: 'The game loop, collisions & fairness.',
    slides: HOW_IT_WORKS,
  },
];

export function renderLearn(container: HTMLElement, onExit: () => void): () => void {
  const wrap = el('div', 'learn');
  container.append(wrap);

  let slideCleanup: (() => void) | null = null;
  function clearSlide(): void {
    if (slideCleanup) slideCleanup();
    slideCleanup = null;
  }

  function showHub(): void {
    clearSlide();
    wrap.replaceChildren();
    wrap.append(el('h1', 'learn-title', '📚 Learn'));
    wrap.append(
      el('p', 'learn-lead', 'Wiggle Wars is fun — and it can teach you a few things too. Pick a topic.'),
    );
    const list = el('div', 'lesson-list');
    for (const lesson of LESSONS) {
      const b = el('button', 'lesson-btn');
      b.append(
        el('span', 'lesson-icon', lesson.icon),
        el('span', 'lesson-name', lesson.title),
        el('span', 'lesson-blurb', lesson.blurb),
      );
      b.addEventListener('click', () => runLesson(lesson));
      list.append(b);
    }
    wrap.append(list);
    const back = el('button', 'btn', '← Menu');
    back.addEventListener('click', onExit);
    wrap.append(back);
    wrap.scrollTop = 0;
  }

  function runLesson(lesson: Lesson): void {
    let i = 0;
    const renderSlide = (): void => {
      clearSlide();
      wrap.replaceChildren();
      wrap.append(el('div', 'learn-step', `${lesson.title} · ${i + 1}/${lesson.slides.length}`));
      const host = el('div', 'learn-slide');
      wrap.append(host);
      slideCleanup = lesson.slides[i](host) || null;

      const nav = el('div', 'learn-nav');
      const back = el('button', 'btn', i === 0 ? '← Topics' : '← Back');
      back.addEventListener('click', () => {
        if (i === 0) showHub();
        else {
          i--;
          renderSlide();
        }
      });
      const next = el('button', 'btn primary', i === lesson.slides.length - 1 ? 'Done ✓' : 'Next →');
      next.addEventListener('click', () => {
        if (i === lesson.slides.length - 1) showHub();
        else {
          i++;
          renderSlide();
        }
      });
      nav.append(back, next);
      wrap.append(nav);
      wrap.scrollTop = 0;
    };
    renderSlide();
  }

  showHub();
  return () => {
    clearSlide();
    wrap.remove();
  };
}
