import { el, type Cleanup } from './kit';

// Clearly-labelled FAKE demos of each trick. The kid pokes one; the moment they
// feel the pull, `reveal()` fires and the surrounding card names + defuses it.
// Nothing rewards or tracks anything — a museum exhibit with a big label.

export type DemoBuilder = (stage: HTMLElement, reveal: () => void) => Cleanup;

export const DEMOS: Record<string, DemoBuilder> = {
  'surprise-machine': (stage, reveal) => {
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

  'hurry-miss-out': (stage, reveal) => {
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

  'dont-break-chain': (stage, reveal) => {
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

  'friends-watching': (stage, reveal) => {
    const n1 = el('div', 'demo-notif', '😮 Sam just beat your high score!');
    const n2 = el('div', 'demo-notif', '👀 3 of your friends are playing right now');
    const btn = el('button', 'demo-big', 'Get back in!');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      reveal();
    });
    stage.append(n1, n2, btn);
  },

  'sticky-exit': (stage, reveal) => {
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

  'money-door': (stage, reveal) => {
    const banner = el('div', 'demo-banner', 'You keep losing to players who paid 😢');
    const btn = el('button', 'demo-big', '⭐ Buy SUPER SPEED — 💎 $4.99');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      reveal();
    });
    stage.append(banner, btn);
  },

  'too-far-to-quit': (stage, reveal) => {
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

  'one-step-behind': (stage, reveal) => {
    const board = el('div', 'demo-notif', '🏆 You are ranked #4,812');
    const chase = el('div', 'demo-banner', 'So close! Beat #4,811 to climb!');
    const btn = el('button', 'demo-big', 'Climb the ranks!');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      reveal();
    });
    stage.append(board, chase, btn);
  },

  'constant-tap': (stage, reveal) => {
    const n1 = el('div', 'demo-notif', '🔔 We miss you! Come back and play!');
    const n2 = el('div', 'demo-notif', '🔔 Your worms are lonely without you 🥺');
    const btn = el('button', 'demo-big', 'Open the game');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      reveal();
    });
    stage.append(n1, n2, btn);
  },

  'sneaky-button': (stage, reveal) => {
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

  'slowing-treadmill': (stage, reveal) => {
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
};
