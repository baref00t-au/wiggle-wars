// App entry: show the menu, run a same-device match, return to the menu on exit.
// The only data kept is local gameplay settings (see settings.ts) — no nicknames,
// no analytics, no network.

import { renderMenu } from './ui/menu';
import type { MatchSetup } from './ui/menu';
import { renderLearn } from './ui/learn';
import { SameDeviceMode } from './modes/sameDevice';
import { Sfx } from './audio/sfx';
import { el } from './ui/dom';
import { loadSettings, patchSettings } from './settings';
import { applyReducedMotion, store } from './learn/store';
import { createInitialState, makeConfig, step } from './sim/simulation';
import { AiInput } from './ai/aiInput';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app container is missing');
app.replaceChildren();

const settings = loadSettings();
applyReducedMotion(store.reducedMotion());
const sfx = new Sfx(settings.muted);

// Resume audio on the first real user gesture (required by browsers), unless muted.
function unlockAudioOnce(): void {
  if (!sfx.isMuted) sfx.unlock();
  window.removeEventListener('pointerdown', unlockAudioOnce);
  window.removeEventListener('keydown', unlockAudioOnce);
}
window.addEventListener('pointerdown', unlockAudioOnce);
window.addEventListener('keydown', unlockAudioOnce);

// Persistent sound toggle (muted by default for classrooms).
const muteBtn = el('button', 'mute-btn', sfx.isMuted ? '🔇' : '🔊');
muteBtn.title = 'Sound on / off';
muteBtn.addEventListener('click', () => {
  const muted = sfx.toggle();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  patchSettings({ muted });
});
document.body.append(muteBtn);

// Only one screen (menu, learn, or game) is mounted at a time; `cleanup` tears
// down whatever is currently up before the next one mounts.
let cleanup: (() => void) | null = null;
function clearScreen(): void {
  cleanup?.();
  cleanup = null;
}

function showMenu(): void {
  clearScreen();
  cleanup = renderMenu(app!, startMatch, showLearn);
}

function showLearn(): void {
  clearScreen();
  cleanup = renderLearn(app!, showMenu);
}

function startMatch(setup: MatchSetup): void {
  clearScreen();
  const mode = new SameDeviceMode(app!, setup, sfx, showMenu);
  mode.start();
  cleanup = () => mode.dispose();
}

showMenu();

// Dev-only headless harness for evaluating bot strength (stripped from prod).
const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
if (isDev) {
  (window as unknown as Record<string, unknown>).wiggleDev = { createInitialState, makeConfig, step, AiInput };
}
