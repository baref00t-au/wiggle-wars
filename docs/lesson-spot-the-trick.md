# Lesson plan — "Spot the Trick" (digital literacy)

**Goal:** students learn to name and recognise manipulative design patterns in
games and apps, so they become critical players rather than targets.

- **Age range:** roughly upper-primary through secondary (adjusting notes below).
- **Duration:** one 45–60 min lesson, or two shorter sessions.
- **Curriculum fit:** digital literacy / media literacy / health & wellbeing /
  critical thinking. (In AU: Digital Technologies and Health & Physical Education
  learning areas, plus the Critical and Creative Thinking general capability.)

## Learning objectives

By the end, students can:
1. Name at least four common "engagement trick" patterns.
2. Identify examples in games/apps they already use.
3. Explain *why* the trick works on our brains.
4. Distinguish "this is fun" from "this is designed to be hard to stop."

## Materials

- **Wiggle Wars itself** — the honest counter-example (it has none of these tricks;
  see [`../ETHICS.md`](../ETHICS.md)). If the build includes the in-game **Learn →
  Spot the Trick** section, you can run the trick cards straight from the game.
- The five trick cards (below) — print as posters or slides.
- Optional: screenshots / short clips of common patterns (teacher-sourced,
  age-appropriate).

## The five tricks, in kid-friendly language

1. **The Surprise Machine** (variable rewards) — *"You never know when you'll get the
   good prize, so you keep trying — like a claw machine that sometimes gives you a
   toy."* Why it works: surprise makes our brain pay extra attention.
2. **Hurry Or Miss Out** (artificial scarcity) — *"Only 10 minutes left! Last
   chance!"* Why it works: we hate missing out, so we rush instead of deciding
   calmly. The "limit" is usually fake — the game made it up.
3. **Don't Break The Chain** (streaks) — *"Play every day or you lose your streak!"*
   Why it works: once we've built something up, losing it feels worse than never
   having it — so we feel forced to keep going even when we're not enjoying it.
4. **Your Friends Are Watching** (social pressure) — *"Someone beat your score! Your
   team needs you!"* Why it works: we care a lot about what friends think, so the
   game uses that to pull us back.
5. **The Sticky Exit** (quitting friction) — *"Are you SURE you want to leave? You'll
   lose everything!"* and the next round starting on its own. Why it works: it makes
   stopping harder than starting, hoping you'll just keep going.

## Lesson flow

1. **Hook (5 min).** Play one quick match of Wiggle Wars. Ask: *"Why is this fun? And
   what makes you want to play again?"* Draw out: it's close, it's fast, it's with
   friends. Note there's no prize, no timer, nothing forcing them — they just *want*
   to. Park this; we'll come back to it.
2. **Introduce the idea (10 min).** Some games are fun *and* designed to be hard to
   stop — two different things. Introduce the five trick cards one at a time, in kid
   language, with the "why it works." Keep it concrete.
3. **Detective activity (15 min).** In small groups, students list games/apps they
   play and try to spot the tricks. *"Which of the five have you seen? Where?"* Each
   group shares one example. (No shaming of favourite games — the point is
   *noticing*, not "these games are bad.")
4. **Compare to Wiggle Wars (8 min).** Return to the hook. Go through the five tricks
   and check Wiggle Wars against each — it has none. Discuss: *"It's still fun. So you
   don't NEED the tricks to make a good game. The tricks aren't there to make it more
   fun — they're there to make it harder to stop."* This is the key insight.
5. **Empower (7 min).** What can you do when you spot a trick? Name it out loud ("oh,
   that's a Surprise Machine"). Decide on purpose how long to play *before* starting.
   Notice the difference between "I'm having fun" and "I just can't stop." Talk to an
   adult if a game feels like it's controlling you.
6. **Exit ticket (3 min).** Each student writes: one trick they can now name, one
   place they've seen it, and one thing they'll do about it.

## Adjusting by age

- **Younger (upper primary):** stick to 3 tricks (Surprise Machine, Hurry Or Miss
  Out, Sticky Exit), more play, simpler exit ticket (draw a trick).
- **Older (secondary):** add the business angle — *why* companies design this way
  (attention = money), the ethics, and the regulation (loot-box bans, kids'-privacy
  laws). Extend to a design challenge: "redesign a trick into an honest feature."

## More tricks (for older students)

Add these six once the core five are solid (all are in the in-game **Learn → More
Tricks** lesson):

6. **The Money Door** (pay-to-win / hidden costs) — *free to play, but the good stuff
   costs, or payers win.*
7. **Too Far To Quit** (sunk cost) — *"you're 90% there!"* keeps you from stopping.
8. **Always One Step Behind** (manufactured comparison) — rankings built to keep you
   chasing.
9. **The Constant Tap On The Shoulder** (notification bait) — pings on a schedule, not
   because anything happened.
10. **The Sneaky Button** (dark patterns) — the huge "YES!" and the tiny greyed "no
    thanks." *Read before you click.*
11. **The Slowing Treadmill** (reward inflation) — rewards rain down early, then slow
    so you grind for the same feeling.

## Part C — Broader learning threads

The game is a vehicle for far more than spotting tricks. Three threads, roughly
easiest to most ambitious. The first three are also built into the in-game **Learn**
hub (Beyond Games, Be an Honest Designer, How Wiggle Wars Works).

### Thread 1 — Media literacy across the whole digital world

The trick vocabulary isn't just about games. The **same patterns** appear in social
media (infinite scroll = endless structure; "X tagged you" = social pressure),
shopping apps (countdown timers = scarcity; "only 2 left!"), and streaming (autoplay
= quitting friction).

*Activity:* students take three tricks they learned and hunt for them **outside**
games — in apps, ads, websites. Share findings. The lesson: a lens for the entire
attention economy, anchored in something they already understand.

### Thread 2 — Design ethics: "Design Your Own Honest Game"

Students become designers and confront the choices directly.

*Activity:* in groups, propose features for a game (or for Wiggle Wars). Each must
pass the one-line test — *"more fun, or just harder to stop?"* Then redesign one
manipulative trick into an **honest** feature (e.g. turn a "daily streak" into an
optional "skills you've unlocked" gallery with no penalty for not playing).

*Discussion:* *why* do companies build the manipulative version? (Attention = money.)
What's the designer's responsibility? Genuine ethics, owned by the students.

### Thread 3 — STEM / how the game actually works

For a computing/STEM tie-in, Wiggle Wars is a clean, visible example of real concepts:

- **The game loop & determinism** — the game advances in fixed steps; same inputs
  always give the same result. A tangible intro to simulations and reproducibility.
- **Collision detection** — how does it know a line hit a wall or another trail?
  Geometry made visible and playable.
- **Multiplayer sync** — how do separate devices agree on what's happening? An
  accessible window into networking and "single source of truth."
- **Randomness vs. fairness** — the game uses a *seeded* random start so it's fair and
  repeatable; contrast with the "Surprise Machine" that uses randomness to manipulate.
  Same tool, opposite intent — a great bridge back to ethics.

*Activity (advanced):* if students can read or tweak code, let them change one rule
(line speed, turn rate, arena size) and observe the effect — connecting a line of code
to a felt change in play.

## Optional extension — students as designers

Have students propose one feature for Wiggle Wars and run it through the one-line
test: *"Does this make it more fun, or just harder to stop?"* It turns the lesson
into design ethics they own. (The in-game **Be an Honest Designer** lesson is a
ready-made version of this.)

## A note for the teacher

The aim isn't to scare kids off games or moralise — it's to hand them the
vocabulary. A child who can say *"that's just a streak trying to guilt me"* has most
of the defence already. **Naming a manipulation is what disarms it.**
