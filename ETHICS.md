# Wiggle Wars — Ethics: "Engaging, Not Addictive"

**The principle: earn the player's time, don't override their judgment.**

Every manipulative pattern below works by exploiting a gap in self-control, sense
of time, or social sensitivity. Children have the widest gaps, so the bar is
strict. This file is a hard checklist for anyone who touches the code later.

## Red flags to avoid

| 🚩 Red flag (never add) | Why it's harmful | ✅ Do this instead |
|---|---|---|
| **Variable / random rewards** (loot boxes, surprise drops, spin-to-win) | Slot-machine uncertainty bypasses rational judgment; kids have least impulse control. Regulated/banned in several countries. | Reward **skill** — visible improvement, sharper turns, better trail tactics. Outcomes are earned, not random. |
| **Artificial scarcity** (countdown timers, limited-time items, energy/lives that make you wait or pay) | Manufactured urgency creates FOMO and pressure on parents to pay. The limit is fake. | No timers, no energy gates. Fully available whenever the player chooses to open it. |
| **Streak mechanics** (daily-login rewards, "don't break your streak!") | Converts play into obligation and anxiety; overrides the natural "I'm done now" signal. | No streaks, no daily pressure. Coming back is driven by it being fun, full stop. |
| **Social pressure loops** (notifications that someone beat you, "your friend is waiting", guilt for letting a team down) | Weaponises belonging and social anxiety — especially potent for kids/teens. | Social fun stays **in the room** — laughter and rematches with people physically present. No nagging notifications. |
| **Quitting friction** (autoplay next round, "are you sure? you'll lose your bonus!", buried exit) | Exploits the gap between deciding to stop and being able to. | Clean stopping points. One obvious "back to menu." Nothing auto-starts. Quitting is frictionless. |
| **Infinite / endless structures** (endless scroll, no natural end) | Removes the natural finish line that lets a child stop. | Short rounds, first-to-target-score **ends**, then a calm results screen. |
| **Data collection / tracking on kids** | Privacy harm; legal exposure (COPPA, GDPR-K, AU Privacy Act). | Collect nothing. No analytics on students, no third-party trackers. |

**One-line test for any future feature:**
*"Does this make the game more fun, or just harder to stop?"* If it's the second, cut it.

## How Wiggle Wars complies today

- **Rewards are pure skill.** You score by outlasting others; there is no randomness
  in scoring, no prizes, no unlocks. (Spawn positions are randomised for variety —
  that is fairness, not a reward mechanic.)
- **No timers or gates.** The only countdown is the "3 – 2 – 1 – GO" readiness beat
  at the start of a round. No energy, no lives, no waiting, no limited-time anything.
- **No streaks, no daily anything.** Nothing tracks how often you return.
- **No social pressure.** No accounts, no logins, no network in local play, no
  notifications. Play is face-to-face with people in the room.
- **Frictionless quitting.** Rounds never auto-start — they wait for a tap or Space.
  A visible **Menu** button (and the **Esc** key) returns to the menu at any time.
  Matches end at the target score and stop at a calm results screen.
- **Short, finite matches.** Rounds last seconds; the match ends; you choose whether
  to play again.
- **Collect nothing.** No analytics, no trackers, no network calls during local play.
  Settings (sound, colours, difficulty) are stored only on the device; nicknames are
  never stored at all.

See [`docs/lesson-spot-the-trick.md`](docs/lesson-spot-the-trick.md) for the
classroom lesson that uses this game as the honest counter-example.
