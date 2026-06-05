# Wiggle Wars

A browser-based, classroom-friendly multiplayer "growing line" game. Each player
steers a continuously-growing line **left or right only**; you lose if you hit a
wall, another trail, or your own.

Zero install, no accounts, no data collection — see the build plan for the full
design constraints.

**Teachers:** start with the **[brief for teachers](docs/for-teachers.md)**.

## Engaging, not addictive

Wiggle Wars deliberately contains **none** of the manipulative "engagement" patterns
common in kids' games — no random rewards, timers, streaks, social pressure, sticky
exits, or tracking. The rule is: *earn the player's time, don't override their
judgment.* See **[ETHICS.md](ETHICS.md)** for the full checklist and how the game
complies. There's also a classroom lesson,
**[Spot the Trick](docs/lesson-spot-the-trick.md)**, that uses the game as an honest
counter-example to teach kids to recognise these tricks.

## Status

- **Phase 1 — Core simulation:** ✅ done. Pure, deterministic engine in `src/sim`,
  covered by Vitest.
- **Phase 2 — Rendering & single-player test:** ✅ done. Canvas renderer,
  fixed-timestep loop, keyboard input; drive one line with arrows/A-D.
- **Phase 3 — Same-device multiplayer (first shippable):** ✅ done. Menu
  (2–4 players, colours, nicknames, target score, **Human/Bot per slot**),
  keyboard **and** touch input, HUD, round → match loop, death/win effects,
  muted-by-default sound, settings saved locally. **Ready to test with students.**
  - **AI players:** any slot can be a bot (at least 1 human). Bots steer by
    lookahead over a coarse occupancy grid — see `src/ai/`.
- **Phase 4 — Same-WiFi multiplayer:** ✅ done. Host-authoritative netcode over
  WebRTC (PeerJS): a lobby with a room code, one device hosts the authoritative sim
  and broadcasts compact trail deltas, clients render and send only their steering.
  See `src/net/` (the sync protocol is unit-tested in `tests/protocol.test.ts`).

## Architecture rule

`src/sim/` is pure and deterministic: **no DOM, canvas, or network imports.**
The simulation is `step(state, inputs) -> nextState`, a fixed-timestep function of
serializable state. This is what lets every multiplayer mode reuse identical logic.

## Develop

```bash
npm install
npm test            # run the deterministic simulation suite
npm run dev         # Vite dev server
npm run typecheck
npm run build       # production build into dist/ (static files)
npm run generate-icons   # regenerate PWA icons from public/icon.svg
```

## Deploy & install

`npm run build` produces a `dist/` folder of plain static files — host it anywhere
(Netlify, GitHub Pages, a school web folder). It's a **PWA**: on Android (Chrome)
and iPad (Safari) you can **Add to Home Screen** to install it as a full-screen,
**offline** app (Workbox precaches the whole shell; the game makes no network
calls). No app store, accounts, or data collection.
