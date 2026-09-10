import { colorFor } from '../render/colors';
import { el } from './dom';

export interface HomeOptions {
  /** Carousel panel to show first (0 same device, 1 WiFi/online, 2 learn). */
  mode: number;
  muted: boolean;
  onToggleSound: () => boolean; // returns the new muted state
  onModeChange: (mode: number) => void;
  onSameDevice: () => void;
  onWifi: () => void;
  onLearn: () => void;
}

interface Panel {
  num: string;
  kicker: string;
  title: string;
  blurb: string;
  cta: string;
  tint: string;
  go: () => void;
}

const SWIPE_FRACTION = 0.15; // of the viewport width
const FLICK_PX_PER_MS = 0.4;

/**
 * Home: a full-screen, swipeable carousel of the three modes. One decision per
 * screen — nothing else is asked here. Returns a dispose function.
 */
export function renderHome(container: HTMLElement, opts: HomeOptions): () => void {
  const panels: Panel[] = [
    {
      num: '01',
      kicker: 'SAME DEVICE',
      title: 'Two to four round one screen',
      blurb: 'Grab a corner of the tablet. Steer left or right, don’t crash, last one wiggling wins.',
      cta: 'Set up match',
      tint: '#56B4E9',
      go: opts.onSameDevice,
    },
    {
      num: '02',
      kicker: 'WIFI / ONLINE',
      title: 'Own device, one room code',
      blurb:
        'One device hosts the game. Everyone else joins with a four-letter code — same WiFi or over the internet.',
      cta: 'Host or join',
      tint: '#E69F00',
      go: opts.onWifi,
    },
    {
      num: '03',
      kicker: 'LEARN',
      title: 'Spot the tricks games use',
      blurb:
        'Six short lessons on the tricks that keep you hooked — and what this game chose not to build.',
      cta: 'Open lessons',
      tint: '#CC79A7',
      go: opts.onLearn,
    },
  ];
  const n = panels.length;
  let index = ((opts.mode % n) + n) % n;

  const wrap = el('div', 'home');
  container.append(wrap);

  // ----- top bar -----
  const bar = el('div', 'home-bar');
  const wordmark = el('div', 'wordmark');
  wordmark.append(el('span', 'wordmark-name', 'WIGGLE WARS'), el('span', 'wordmark-ver', 'v4'));
  const sound = el('button', 'sound-btn', opts.muted ? '🔇' : '🔊');
  sound.title = 'Sound on / off';
  sound.setAttribute('aria-label', 'Sound on / off');
  sound.addEventListener('click', () => {
    sound.textContent = opts.onToggleSound() ? '🔇' : '🔊';
  });
  bar.append(wordmark, sound);

  // ----- carousel -----
  const viewport = el('div', 'carousel');
  const track = el('div', 'carousel-track');
  panels.forEach((p, i) => {
    const panel = el('section', 'carousel-panel');
    panel.setAttribute('aria-label', p.kicker);

    const eyebrow = el('div', 'panel-eyebrow');
    const num = el('span', 'panel-num', p.num);
    num.style.color = p.tint;
    eyebrow.append(num, el('span', 'panel-rule'), el('span', 'panel-kicker', p.kicker));

    const glyphs = el('div', 'glyph-strip');
    glyphs.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < 4; k++) {
      const c = colorFor(i + k);
      const tile = el('span', 'glyph-tile', c.glyph);
      tile.style.color = c.line;
      glyphs.append(tile);
    }

    const cta = el('button', 'btn-primary large', p.cta);
    cta.addEventListener('click', () => {
      if (!dragged) p.go();
    });

    panel.append(
      eyebrow,
      el('h1', 'panel-title', p.title),
      el('p', 'panel-blurb', p.blurb),
      glyphs,
      cta,
    );
    track.append(panel);
  });
  viewport.append(track);

  // ----- pager -----
  const pager = el('div', 'pager');
  const prev = el('button', 'pager-arrow', '◀');
  prev.setAttribute('aria-label', 'Previous mode');
  const next = el('button', 'pager-arrow', '▶');
  next.setAttribute('aria-label', 'Next mode');
  const dots = el('div', 'dots');
  const dotEls: HTMLButtonElement[] = panels.map((p, i) => {
    const d = el('button', 'dot');
    d.setAttribute('aria-label', `Go to ${p.kicker}`);
    d.addEventListener('click', () => goTo(i));
    dots.append(d);
    return d;
  });
  prev.addEventListener('click', () => goTo((index + n - 1) % n));
  next.addEventListener('click', () => goTo((index + 1) % n));
  pager.append(prev, dots, next);

  wrap.append(bar, viewport, pager, el('div', 'home-foot', 'NO ACCOUNTS · NO ADS · WORKS OFFLINE'));

  function setTrack(offsetPx = 0, animate = true): void {
    track.style.transition = animate ? '' : 'none';
    const pct = -(index * 100) / n;
    track.style.transform = offsetPx ? `translateX(calc(${pct}% + ${offsetPx}px))` : `translateX(${pct}%)`;
  }

  function goTo(i: number): void {
    index = ((i % n) + n) % n;
    dotEls.forEach((d, k) => {
      d.classList.toggle('on', k === index);
      d.setAttribute('aria-current', k === index ? 'true' : 'false');
    });
    setTrack();
    opts.onModeChange(index);
  }

  // ----- swipe (touch / pen / mouse drag over the viewport) -----
  let dragged = false;
  let drag: { id: number; x0: number; t0: number; dx: number } | null = null;

  const onDown = (e: PointerEvent): void => {
    if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { id: e.pointerId, x0: e.clientX, t0: performance.now(), dx: 0 };
    dragged = false;
  };
  const onMove = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    if (Math.abs(drag.dx) > 6) dragged = true;
    if (dragged) setTrack(drag.dx, false);
  };
  const onUp = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.id) return;
    const { dx, t0 } = drag;
    drag = null;
    if (!dragged) return;
    const dt = Math.max(1, performance.now() - t0);
    const far = Math.abs(dx) > viewport.clientWidth * SWIPE_FRACTION;
    const flick = Math.abs(dx) / dt > FLICK_PX_PER_MS;
    if (far || flick) goTo(dx < 0 ? index + 1 : index - 1);
    else setTrack();
    // Let the click that follows this pointerup be swallowed, then re-arm.
    setTimeout(() => {
      dragged = false;
    }, 0);
  };
  viewport.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') goTo(index - 1);
    else if (e.key === 'ArrowRight') goTo(index + 1);
  };
  document.addEventListener('keydown', onKey);

  goTo(index);
  // Skip the slide-in on first paint.
  track.style.transition = 'none';
  void track.offsetWidth;
  track.style.transition = '';

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    document.removeEventListener('keydown', onKey);
    wrap.remove();
  };
}
