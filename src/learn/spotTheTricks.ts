import { el, type Back, type Cleanup } from './kit';
import { GOLDEN_QUESTION, TRICKS, type Trick } from './content';
import { DEMOS } from './demos';
import { store } from './store';

// 3.1 Spot the Tricks — a card grid (filtered by the age toggle), a detail view
// per trick with its live demo + all four fields, and a no-score / no-fail quiz.

function field(label: string, text: string, cls = ''): HTMLElement {
  const d = el('div', `trick-field ${cls}`);
  d.append(el('div', 'trick-field-label', label), el('div', 'trick-field-text', text));
  return d;
}

function buildFields(parent: HTMLElement, t: Trick): void {
  parent.append(
    field('What it is', t.whatItIs),
    field('Examples', t.examples.join(' · ')),
    field('Why it works', t.whyItWorks),
    field('🔍 Spot it', t.spotItQuestion, 'spot'),
    field('✅ Honest instead', t.honestAlternative, 'honest'),
  );
}

export function renderSpotTheTricks(host: HTMLElement, back: Back): Cleanup {
  let demoCleanup: (() => void) | null = null;
  const clearDemo = (): void => {
    if (demoCleanup) demoCleanup();
    demoCleanup = null;
  };

  function bar(titleText: string): HTMLElement {
    return el('h2', 'learn-h2', titleText);
  }

  function ageToggle(): HTMLElement {
    const row = el('div', 'age-toggle');
    row.append(el('span', 'age-label', 'Show:'));
    (['younger', 'older'] as const).forEach((tier) => {
      const b = el('button', `pill${store.audience() === tier ? ' on' : ''}`, tier === 'younger' ? 'Younger' : 'Older');
      b.addEventListener('click', () => {
        store.setAudience(tier);
        showGrid();
      });
      row.append(b);
    });
    return row;
  }

  function visibleTricks(): Trick[] {
    return store.audience() === 'older' ? TRICKS : TRICKS.filter((t) => t.ageTier === 'core');
  }

  function showGrid(): void {
    clearDemo();
    host.replaceChildren();
    host.append(bar('🔎 Spot the Tricks'));
    host.append(el('div', 'golden', `🧭 ${GOLDEN_QUESTION}`));
    host.append(ageToggle());

    const list = visibleTricks();
    const grid = el('div', 'trick-grid');
    for (const t of list) {
      const card = el('button', 'trick-card');
      card.append(el('span', 'trick-emoji', t.emoji), el('span', 'trick-name', t.kidName));
      card.addEventListener('click', () => showDetail(t, list));
      grid.append(card);
    }
    host.append(grid);

    const quiz = el('button', 'btn primary', 'Try a quick quiz →');
    quiz.addEventListener('click', () => showQuiz(list));
    const navRow = el('div', 'learn-nav');
    const bk = el('button', 'btn', '← Back');
    bk.addEventListener('click', back);
    navRow.append(bk, quiz);
    host.append(navRow);
    host.scrollTop = 0;
  }

  function showDetail(t: Trick, list: Trick[]): void {
    clearDemo();
    host.replaceChildren();
    host.append(bar(`${t.emoji} ${t.kidName}`));
    if (store.audience() === 'older') host.append(el('div', 'trick-realname', t.realName));

    const demo = DEMOS[t.id];
    const reveal = el('div', 'reveal');
    buildFields(reveal, t);

    if (demo) {
      host.append(el('p', 'learn-prompt', '👇 Try it — then we’ll name it'));
      const stage = el('div', 'demo-stage');
      host.append(stage, reveal);
      const c = demo(stage, () => reveal.classList.add('show'));
      demoCleanup = typeof c === 'function' ? c : null;
    } else {
      reveal.classList.add('show');
      host.append(reveal);
    }

    const idx = list.findIndex((x) => x.id === t.id);
    const nav = el('div', 'learn-nav');
    const prev = el('button', 'btn', '← Cards');
    prev.addEventListener('click', () => showGrid());
    nav.append(prev);
    if (idx < list.length - 1) {
      const next = el('button', 'btn primary', 'Next trick →');
      next.addEventListener('click', () => showDetail(list[idx + 1], list));
      nav.append(next);
    }
    host.append(nav);
    host.scrollTop = 0;
  }

  function showQuiz(list: Trick[]): void {
    clearDemo();
    host.replaceChildren();
    host.append(bar('🔎 Quick quiz'));
    host.append(el('p', 'learn-lead', 'No score, no fail — just spotting. Match each example to its trick.'));

    const count = Math.min(4, list.length);
    for (let i = 0; i < count; i++) {
      const answer = list[i];
      const others = list.filter((t) => t.id !== answer.id);
      // deterministic options: answer + two rotating distractors, placed by index
      const opts = [answer, others[i % others.length], others[(i + 1) % others.length]].filter(
        (t, j, arr) => arr.findIndex((x) => x.id === t.id) === j,
      );
      const ordered = opts.slice();
      // rotate so the answer isn't always first
      for (let r = 0; r < i % ordered.length; r++) ordered.push(ordered.shift()!);
      host.append(quizCard(answer, ordered));
    }

    const done = el('button', 'btn primary', 'Back to cards');
    done.addEventListener('click', () => showGrid());
    host.append(done);
    host.scrollTop = 0;
  }

  function quizCard(answer: Trick, options: Trick[]): HTMLElement {
    const card = el('div', 'quiz-row');
    card.append(el('div', 'quiz-feature', `“${answer.examples[0]}” — which trick is that?`));
    const verdict = el('div', 'quiz-verdict');
    const btns = el('div', 'quiz-btns');
    for (const opt of options) {
      const b = el('button', 'quiz-opt', `${opt.emoji} ${opt.kidName}`);
      b.addEventListener('click', () => {
        const correct = opt.id === answer.id;
        verdict.textContent = correct ? `Yes! That’s ${answer.kidName}.` : 'Not quite — look again.';
        verdict.className = `quiz-verdict show ${correct ? 'ok' : 'no'}`;
        if (correct) {
          for (const child of Array.from(btns.children)) (child as HTMLButtonElement).disabled = true;
        }
      });
      btns.append(b);
    }
    card.append(btns, verdict);
    return card;
  }

  showGrid();
  return () => clearDemo();
}
