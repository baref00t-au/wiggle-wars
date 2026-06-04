import { el, type Back, type Cleanup } from './kit';
import { HONEST_PROMISE, trickById } from './content';

// §6 Honest Game Promise — "what we chose NOT to build, and why", each mapped to
// the trick it would have been. The game openly practising what it teaches.

export function renderHonestPromise(host: HTMLElement, back: Back): Cleanup {
  host.replaceChildren();

  host.append(el('h2', 'learn-h2', '🤝 Our Honest Promise'));

  host.append(
    el('p', 'learn-lead', 'Wiggle Wars teaches you to spot tricks — so it doesn’t use any. Here’s what we left out on purpose:'),
  );

  const list = el('div', 'promise-list');
  for (const item of HONEST_PROMISE) {
    const trick = trickById(item.trickId);
    const row = el('div', 'promise-item');
    row.append(el('div', 'promise-text', `✅ ${item.text}`));
    if (trick) row.append(el('div', 'promise-trick', `→ that would be ${trick.emoji} ${trick.kidName}`));
    list.append(row);
  }
  const privacy = el('div', 'promise-item');
  privacy.append(
    el('div', 'promise-text', '✅ We collect nothing about you.'),
    el('div', 'promise-trick', '→ your play stays private, on this device only'),
  );
  list.append(privacy);
  host.append(list);

  host.append(el('p', 'learn-body', 'It’s still fun without any of these — that’s the whole point.'));

  const done = el('button', 'btn primary', 'Back to Learn');
  done.addEventListener('click', back);
  host.append(done);
  host.scrollTop = 0;
}
