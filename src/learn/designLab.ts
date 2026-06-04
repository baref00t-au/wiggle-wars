import { el, type Back, type Cleanup } from './kit';
import { GOLDEN_QUESTION, TRICKS, trickById } from './content';
import { store } from './store';

// 3.3 Design Lab — the flagship. A guided, no-time-pressure flow; the kid designs
// an honest version of a trick. Saved on-device only as "My Honest Design".

const REASONS = [
  'The matches are close',
  'You restart fast',
  'Playing with friends',
  'I keep getting better',
  'It’s just fun',
];

export function renderDesignLab(host: HTMLElement, back: Back): Cleanup {
  let step = 0;
  const chosenReasons = new Set<string>();
  let trickId = '';
  let honestIdea = '';
  let promiseBecause = '';

  function topBar(title: string): HTMLElement {
    const b = el('div', 'learn-bar');
    const btn = el('button', 'btn small', '← Back');
    btn.addEventListener('click', back);
    b.append(btn, el('h2', 'learn-h2', title));
    return b;
  }

  function nav(canNext: boolean, nextLabel = 'Next →'): HTMLElement {
    const row = el('div', 'learn-nav');
    const b = el('button', 'btn', '← Back');
    b.addEventListener('click', () => {
      if (step === 0) back();
      else {
        step--;
        render();
      }
    });
    const n = el('button', `btn primary`, nextLabel);
    n.disabled = !canNext;
    n.addEventListener('click', () => {
      step++;
      render();
    });
    row.append(b, n);
    return row;
  }

  function render(): void {
    host.replaceChildren();
    const trick = trickById(trickId);

    if (step === 0) {
      host.append(topBar('✏️ Design Lab'));
      host.append(el('p', 'learn-lead', 'Why is Wiggle Wars fun with NO tricks? Pick the reasons you agree with.'));
      const chips = el('div', 'chip-wrap');
      for (const r of REASONS) {
        const c = el('button', `chip${chosenReasons.has(r) ? ' on' : ''}`, r);
        c.addEventListener('click', () => {
          if (chosenReasons.has(r)) chosenReasons.delete(r);
          else chosenReasons.add(r);
          render();
        });
        chips.append(c);
      }
      host.append(chips);
      host.append(nav(chosenReasons.size > 0));
    } else if (step === 1) {
      host.append(topBar('✏️ Pick a trick to fix'));
      host.append(el('p', 'learn-lead', 'Choose one trick. You’ll redesign it to be honest.'));
      const grid = el('div', 'trick-grid');
      for (const t of TRICKS) {
        const card = el('button', `trick-card${t.id === trickId ? ' on' : ''}`);
        card.append(el('span', 'trick-emoji', t.emoji), el('span', 'trick-name', t.kidName));
        card.addEventListener('click', () => {
          trickId = t.id;
          render();
        });
        grid.append(card);
      }
      host.append(grid);
      host.append(nav(trickId !== ''));
    } else if (step === 2 && trick) {
      host.append(topBar(`${trick.emoji} The dishonest version`));
      host.append(el('div', 'trick-realname', trick.kidName));
      host.append(el('p', 'learn-body', `What it does: ${trick.whatItIs}`));
      host.append(el('p', 'learn-body', `Why it’s sneaky: ${trick.whyItWorks}`));
      host.append(nav(true, 'Now fix it →'));
    } else if (step === 3 && trick) {
      host.append(topBar('✨ Design the honest version'));
      host.append(el('p', 'learn-lead', `How would YOU give this its good part without the trick?`));
      const suggest = el('button', `chip${honestIdea === trick.honestAlternative ? ' on' : ''}`, `Use the honest idea: ${trick.honestAlternative}`);
      suggest.addEventListener('click', () => {
        honestIdea = trick.honestAlternative;
        render();
      });
      host.append(suggest);
      host.append(el('p', 'learn-prompt', '…or write your own:'));
      const ta = el('textarea', 'learn-input');
      ta.value = honestIdea === trick.honestAlternative ? '' : honestIdea;
      ta.placeholder = 'My honest idea…';
      ta.addEventListener('input', () => {
        honestIdea = ta.value.trim();
        const n = host.querySelector('.learn-nav .btn.primary') as HTMLButtonElement | null;
        if (n) n.disabled = honestIdea.length === 0;
      });
      host.append(ta);
      host.append(nav(honestIdea.length > 0));
    } else if (step === 4 && trick) {
      host.append(topBar('🧭 The Golden Question'));
      host.append(el('div', 'golden', `🧭 ${GOLDEN_QUESTION}`));
      host.append(el('p', 'learn-body', `Your idea: “${honestIdea}”`));
      host.append(el('p', 'learn-body', 'Does your idea make the game more FUN, without making it harder to STOP? If yes — you designed it honestly. 🎉'));
      host.append(nav(true, 'Make my promise →'));
    } else if (step === 5 && trick) {
      host.append(topBar('🤝 Designer’s Promise'));
      host.append(el('p', 'learn-lead', `Finish your promise:`));
      host.append(el('div', 'promise-frag', `“If I made a game for other kids, I’d never use ${trick.emoji} ${trick.kidName} because…”`));
      const ta = el('textarea', 'learn-input');
      ta.value = promiseBecause;
      ta.placeholder = 'because…';
      ta.addEventListener('input', () => {
        promiseBecause = ta.value.trim();
        const n = host.querySelector('.learn-nav .btn.primary') as HTMLButtonElement | null;
        if (n) n.disabled = promiseBecause.length === 0;
      });
      const row = el('div', 'learn-nav');
      const b = el('button', 'btn', '← Back');
      b.addEventListener('click', () => {
        step--;
        render();
      });
      const save = el('button', 'btn primary', 'Save my design ✓');
      save.disabled = promiseBecause.length === 0;
      save.addEventListener('click', () => {
        store.addDesign({
          trickId,
          honestIdea,
          promise: `I’d never use ${trick.kidName} because ${promiseBecause}`,
        });
        step = 6;
        render();
      });
      row.append(b, save);
      host.append(ta, row);
    } else {
      // result card
      host.append(topBar('🎉 My Honest Design'));
      if (trick) {
        const card = el('div', 'design-card');
        card.append(el('div', 'design-trick', `${trick.emoji} Instead of ${trick.kidName}…`));
        card.append(el('div', 'design-idea', `✨ ${honestIdea}`));
        card.append(el('div', 'design-promise', `🤝 I’d never use ${trick.kidName} because ${promiseBecause}`));
        host.append(card);
      }
      host.append(el('p', 'learn-body', 'Saved on this device — only you can see it.'));
      const again = el('button', 'btn', 'Design another');
      again.addEventListener('click', () => {
        step = 0;
        chosenReasons.clear();
        trickId = '';
        honestIdea = '';
        promiseBecause = '';
        render();
      });
      const done = el('button', 'btn primary', 'Back to Learn');
      done.addEventListener('click', back);
      const row = el('div', 'learn-nav');
      row.append(again, done);
      host.append(row);
    }
    host.scrollTop = 0;
  }

  render();
}
