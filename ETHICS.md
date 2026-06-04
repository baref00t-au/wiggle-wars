# Wiggle Wars — Ethics: "Engaging, Not Addictive"

**The principle: earn the player's time, don't override their judgment.**

Every manipulative pattern below works by exploiting a gap in self-control, sense
of time, or social sensitivity. Children have the widest gaps, so the bar is
strict. This file is a hard checklist for anyone who touches the code later.

## Red flags to avoid (full catalogue)

| 🚩 Red flag (never add) | Why it's harmful | ✅ Do this instead |
|---|---|---|
| **1. Variable / random rewards** (loot boxes, surprise drops, spin-to-win) | Slot-machine uncertainty bypasses rational judgment; kids have least impulse control. Regulated/banned in several countries. | Reward **skill** — visible improvement, sharper turns, better trail tactics. Earned, not random. |
| **2. Artificial scarcity** (countdown timers, limited-time items, energy/lives that gate play) | Manufactured urgency creates FOMO and pressure on parents to pay. The limit is fake. | No timers, no energy gates. Fully available whenever they choose to open it. |
| **3. Streak mechanics** (daily-login rewards, "don't break your streak!") | Converts play into obligation and anxiety; overrides the natural "I'm done now" signal. | No streaks, no daily pressure. Coming back is driven by fun, full stop. |
| **4. Social pressure loops** ("someone beat you", "your team is waiting", guilt mechanics) | Weaponises belonging and social anxiety — especially potent for kids/teens. | Social fun stays **in the room** — laughter and rematches with people present. No nagging. |
| **5. Quitting friction** (autoplay next round, "are you sure? you'll lose your bonus!", buried exit) | Exploits the gap between deciding to stop and being able to. | Clean stopping points. One obvious "back to menu." Nothing auto-starts. |
| **6. Pay-to-win / hidden costs** (paying buys advantage; "free" funnels to purchases) | Unfairness kids feel keenly; pressure on parents; spending detached from value. | If ever monetised, never sell advantage. Keep the playing field equal for everyone. |
| **7. Fake progress / sunk cost** (near-complete bars, "you're 90% there!") | Makes quitting feel like wasting effort, so kids keep going past enjoyment. | Progress reflects **real** skill gained. No manufactured "almost there" to trap them. |
| **8. Manufactured comparison** (rankings designed to make you feel behind) | Drives grinding to catch up; corrodes self-worth via constant ranking. | Celebrate personal improvement. Compare you-to-yesterday, not you-to-strangers. |
| **9. Notification bait** (scheduled pings unrelated to anything real) | Interrupts on the designer's schedule, not the child's; pulls focus from life. | No notifications in the local game. The child decides when to play. |
| **10. Deceptive choices / dark patterns** (tiny greyed "no thanks", giant "YES!", tricking consent) | Tricks kids into clicks/agreements they didn't intend; teaches them not to read. | Clear, equal-weight choices. Honest buttons. Nothing designed to mislead. |
| **11. Reward inflation / the treadmill** (generous early rewards that slow to force more play) | The same satisfaction costs ever-more time (or money) — a hidden grind. | Consistent, honest reward for skill. No bait-and-switch on how good play feels. |
| **(baseline) Data collection / tracking on kids** | Privacy harm; legal exposure (COPPA, GDPR-K, AU Privacy Act). | Collect nothing. No analytics, no third-party trackers. |

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
- **No money, no advantage for sale.** The game is free and unmonetised; if that ever
  changes, nothing that affects winning will be for sale.
- **Honest progress & choices.** No fake "90% complete" bars, no global ranking built
  to make you feel behind, no giant-YES / tiny-greyed-no buttons. Every choice is
  equal-weight and clearly labelled.
- **Consistent rewards.** Skill is rewarded the same way always — no generous-then-
  slowing treadmill.
- **Collect nothing.** No analytics, no trackers, no network calls during local play.
  Settings (sound, colours, difficulty) are stored only on the device; nicknames are
  never stored at all.

See [`docs/lesson-spot-the-trick.md`](docs/lesson-spot-the-trick.md) for the
classroom lesson that uses this game as the honest counter-example.
