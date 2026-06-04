import { el, type Back, type Cleanup } from './kit';
import { HUNT_SCENARIOS, TRICKS, trickById } from './content';

// 3.2 Trick Hunt — the same vocabulary in the wider digital world. Match each
// neutral scenario to its trick. Gentle, no-score feedback.

export function renderTrickHunt(host: HTMLElement, back: Back): Cleanup {
  let i = 0;

  function topBar(): HTMLElement {
    const b = el('div', 'learn-bar');
    const btn = el('button', 'btn small', '← Back');
    btn.addEventListener('click', back);
    b.append(btn, el('h2', 'learn-h2', '🌍 Trick Hunt'));
    return b;
  }

  function show(): void {
    host.replaceChildren();
    host.append(topBar());

    if (i >= HUNT_SCENARIOS.length) {
      host.append(el('h2', 'learn-trick-title', '🎉 Nice hunting!'));
      host.append(
        el('p', 'learn-body', 'The same tricks show up everywhere — social apps, shops, videos — not just in games. Now you can spot them anywhere.'),
      );
      const again = el('button', 'btn', 'Hunt again');
      again.addEventListener('click', () => {
        i = 0;
        show();
      });
      const done = el('button', 'btn primary', 'Back to Learn');
      done.addEventListener('click', back);
      const row = el('div', 'learn-nav');
      row.append(again, done);
      host.append(row);
      host.scrollTop = 0;
      return;
    }

    const sc = HUNT_SCENARIOS[i];
    const answer = trickById(sc.trickId);
    if (!answer) {
      i++;
      show();
      return;
    }

    host.append(el('div', 'hunt-progress', `${i + 1} / ${HUNT_SCENARIOS.length}`));
    host.append(el('div', 'hunt-context', sc.context));
    host.append(el('div', 'hunt-text', `“${sc.text}”`));
    host.append(el('p', 'learn-prompt', 'Which trick is this?'));

    const others = TRICKS.filter((t) => t.id !== answer.id);
    const options = [answer, others[i % others.length], others[(i + 3) % others.length]].filter(
      (t, j, arr) => arr.findIndex((x) => x.id === t.id) === j,
    );
    for (let r = 0; r < i % options.length; r++) options.push(options.shift()!);

    const next = el('button', 'btn primary', i === HUNT_SCENARIOS.length - 1 ? 'Finish →' : 'Next →');
    next.style.display = 'none';
    next.addEventListener('click', () => {
      i++;
      show();
    });

    const verdict = el('div', 'quiz-verdict');
    const btns = el('div', 'quiz-btns');
    for (const opt of options) {
      const x = el('button', 'quiz-opt', `${opt.emoji} ${opt.kidName}`);
      x.addEventListener('click', () => {
        const correct = opt.id === answer.id;
        verdict.textContent = correct ? `Yes — that’s ${answer.kidName}.` : 'Not quite — look again.';
        verdict.className = `quiz-verdict show ${correct ? 'ok' : 'no'}`;
        if (correct) {
          for (const c of Array.from(btns.children)) (c as HTMLButtonElement).disabled = true;
          next.style.display = '';
        }
      });
      btns.append(x);
    }

    host.append(btns, verdict, next);
    host.scrollTop = 0;
  }

  show();
}
