// App entry: show the menu, run a same-device match, return to the menu on exit.
// No data is collected or stored anywhere.

import { renderMenu } from './ui/menu';
import type { MatchSetup } from './ui/menu';
import { SameDeviceMode } from './modes/sameDevice';
import { Sfx } from './audio/sfx';
import { el } from './ui/dom';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app container is missing');
app.replaceChildren();

const sfx = new Sfx();

// Persistent sound toggle (muted by default, as agreed for classrooms).
const muteBtn = el('button', 'mute-btn', '🔇');
muteBtn.title = 'Sound on / off';
muteBtn.addEventListener('click', () => {
  const muted = sfx.toggle();
  muteBtn.textContent = muted ? '🔇' : '🔊';
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
