// App entry: home carousel → set up match → play, plus the WiFi lobby and Learn
// hub. The only data kept is local gameplay settings (see settings.ts) — no
// nicknames, no analytics, no network (except the WiFi/online handshake).

import { renderHome } from './ui/home';
import { renderSetup } from './ui/setup';
import type { MatchSetup } from './ui/setup';
import { renderLearn } from './ui/learn';
import { renderLobby } from './ui/lobby';
import { SameDeviceMode } from './modes/sameDevice';
import { LocalWifiHost } from './modes/localWifiHost';
import { LocalWifiClient } from './modes/localWifiClient';
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

/** Persistent sound toggle (muted by default for classrooms). Returns the new muted state. */
function toggleSound(): boolean {
  const muted = sfx.toggle();
  patchSettings({ muted });
  return muted;
}

// Only one screen (home, setup, learn, lobby, or game) is mounted at a time;
// `cleanup` tears down whatever is currently up before the next one mounts.
let cleanup: (() => void) | null = null;
let homeMode = 0; // carousel panel to return to (session-only)
let reflectionShown = false; // at most once per session (in-memory only)
let reflectionEl: HTMLElement | null = null;

function removeReflection(): void {
  reflectionEl?.remove();
  reflectionEl = null;
}

function clearScreen(): void {
  cleanup?.();
  cleanup = null;
  removeReflection();
}

function showHome(): void {
  clearScreen();
  cleanup = renderHome(app!, {
    mode: homeMode,
    muted: sfx.isMuted,
    onToggleSound: toggleSound,
    onModeChange: (m) => {
      homeMode = m;
    },
    onSameDevice: showSetup,
    onWifi: showWifi,
    onLearn: showLearn,
  });
}

function showSetup(): void {
  clearScreen();
  cleanup = renderSetup(app!, startMatch, showHome);
}

function showLearn(): void {
  clearScreen();
  cleanup = renderLearn(app!, showHome);
}

function showWifi(): void {
  clearScreen();
  cleanup = renderLobby(app!, {
    onHost: (netHost, players) => {
      clearScreen();
      const mode = new LocalWifiHost(app!, netHost, players, sfx, showHome);
      mode.start();
      cleanup = () => mode.dispose();
    },
    onClient: (netClient, myPlayerId, reset) => {
      clearScreen();
      const mode = new LocalWifiClient(app!, netClient, myPlayerId, reset, showHome);
      mode.start();
      cleanup = () => mode.dispose();
    },
    onExit: showHome,
  });
}

function startMatch(setup: MatchSetup): void {
  clearScreen();
  const mode = new SameDeviceMode(app!, setup, sfx, () => exitMatch(mode));
  mode.start();
  cleanup = () => mode.dispose();
}

function exitMatch(mode: SameDeviceMode): void {
  const rounds = mode.roundsPlayed;
  showHome();
  // Honest inverse of a "rate us!" nag: optional, one-tap, once per session,
  // never blocks anything, stores nothing. Only after a real session of play.
  if (rounds >= 2 && !reflectionShown) {
    reflectionShown = true;
    const bar = el('div', 'reflection');
    bar.append(el('span', 'reflection-q', 'What made that fun?'));
    const opts = el('div', 'reflection-opts');
    for (const label of ['It was close', 'Playing together', 'I got better', 'Just fun']) {
      const b = el('button', 'btn small', label);
      b.addEventListener('click', removeReflection);
      opts.append(b);
    }
    const skip = el('button', 'reflection-skip', 'skip');
    skip.addEventListener('click', removeReflection);
    bar.append(opts, skip);
    document.body.append(bar);
    reflectionEl = bar;
  }
}

// PWA shortcut ("Learn" on the home-screen icon's long-press menu) deep-links here.
const wanted = new URLSearchParams(location.search).get('screen');
if (wanted === 'learn') {
  homeMode = 2;
  showLearn();
} else if (wanted === 'wifi') {
  homeMode = 1;
  showWifi();
} else {
  showHome();
}

// Dev-only headless harness for evaluating bot strength (stripped from prod).
const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
if (isDev) {
  (window as unknown as Record<string, unknown>).wiggleDev = { createInitialState, makeConfig, step, AiInput };
}
