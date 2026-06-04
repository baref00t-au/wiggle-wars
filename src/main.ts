// App entry: show the menu, run a same-device match, return to the menu on exit.
// The only data kept is local gameplay settings (see settings.ts) — no nicknames,
// no analytics, no network.

import { renderMenu } from './ui/menu';
import type { MatchSetup } from './ui/menu';
import { SameDeviceMode } from './modes/sameDevice';
import { Sfx } from './audio/sfx';
import { el } from './ui/dom';
import { loadSettings, patchSettings } from './settings';
import { createInitialState, makeConfig, step } from './sim/simulation';
import { AiInput } from './ai/aiInput';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app container is missing');
app.replaceChildren();

const settings = loadSettings();
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

let disposeMenu: (() => void) | null = null;
let mode: SameDeviceMode | null = null;

function showMenu(): void {
  mode = null;
  disposeMenu = renderMenu(app!, startMatch);
}

function startMatch(setup: MatchSetup): void {
  disposeMenu?.();
  disposeMenu = null;
  mode = new SameDeviceMode(app!, setup, sfx, showMenu);
  mode.start();
}

showMenu();

// Dev-only headless harness for evaluating bot strength (stripped from prod).
const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
if (isDev) {
  (window as unknown as Record<string, unknown>).wiggleDev = { createInitialState, makeConfig, step, AiInput };
}
