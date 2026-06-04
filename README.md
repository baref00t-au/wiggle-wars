# Wiggle Wars

A browser-based, classroom-friendly multiplayer "growing line" game. Each player
steers a continuously-growing line **left or right only**; you lose if you hit a
wall, another trail, or your own.

Zero install, no accounts, no data collection — see the build plan for the full
design constraints.

## Status

- **Phase 1 — Core simulation:** ✅ done. Pure, deterministic engine in `src/sim`,
  covered by Vitest.
- **Phase 2 — Rendering & single-player test:** ✅ done. Canvas renderer,
  fixed-timestep loop, keyboard input; drive one line with arrows/A-D.
- **Phase 3 — Same-device multiplayer (first shippable):** ✅ done. Menu
  (2–4 players, colours, nicknames, target score), keyboard **and** touch input,
  HUD, round → match loop, death/win effects, muted-by-default sound.
  **Ready to test with students.**
- Phase 4 — Same-WiFi multiplayer: not started (do not start until Phase 3 is
  tried with real students).

## Architecture rule

`src/sim/` is pure and deterministic: **no DOM, canvas, or network imports.**
The simulation is `step(state, inputs) -> nextState`, a fixed-timestep function of
serializable state. This is what lets every multiplayer mode reuse identical logic.

## Develop

```bash
npm install
npm test        # run the deterministic simulation suite
npm run dev     # Vite dev server (placeholder UI until Phase 2)
npm run typecheck
```
