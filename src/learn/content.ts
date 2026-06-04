// All educational content as structured data, so it's easy to edit, translate,
// and reuse across the Learn modes. No copy is hardcoded in components.

export type AgeTier = 'core' | 'older';

/** One of the 11 manipulative patterns ("tricks") the game teaches kids to spot. */
export interface Trick {
  id: string;
  emoji: string;
  kidName: string;
  /** The real design term — shown only in the "Older" age tier. */
  realName: string;
  whatItIs: string;
  examples: string[];
  whyItWorks: string;
  spotItQuestion: string;
  honestAlternative: string;
  ageTier: AgeTier;
}

export const TRICKS: Trick[] = [
  {
    id: 'surprise-machine',
    emoji: '🎰',
    kidName: 'The Surprise Machine',
    realName: 'Variable / random rewards',
    whatItIs:
      'You never know when you’ll get the good prize, so you keep trying — like a claw machine that sometimes gives a toy.',
    examples: ['loot boxes', 'mystery packs', 'spin-the-wheel'],
    whyItWorks:
      'Surprise makes our brain pay extra attention and keeps us hooked even when most tries give nothing.',
    spotItQuestion: 'Does the game give random prizes to keep me playing?',
    honestAlternative: 'Reward real skill — earned, not random.',
    ageTier: 'core',
  },
  {
    id: 'hurry-miss-out',
    emoji: '⏰',
    kidName: 'Hurry Or Miss Out',
    realName: 'Artificial scarcity',
    whatItIs: '“Only 10 minutes left!” so you rush instead of deciding calmly.',
    examples: ['countdown timers', 'limited-time skins', '“offer ends soon!”'],
    whyItWorks: 'We hate missing out, so we act fast — and the limit is usually made up.',
    spotItQuestion: 'Is the game rushing me with a timer?',
    honestAlternative: 'No timers — the game is there whenever you choose.',
    ageTier: 'core',
  },
  {
    id: 'dont-break-chain',
    emoji: '🔗',
    kidName: 'Don’t Break The Chain',
    realName: 'Streak mechanics',
    whatItIs: '“Play every day or lose your streak!”',
    examples: ['daily-login rewards', 'streak counters'],
    whyItWorks: 'Losing what we built feels worse than never having it, so we feel forced.',
    spotItQuestion: 'Am I playing for fun, or just to not lose a streak?',
    honestAlternative: 'No streaks, no daily pressure.',
    ageTier: 'core',
  },
  {
    id: 'friends-watching',
    emoji: '👀',
    kidName: 'Your Friends Are Watching',
    realName: 'Social pressure loops',
    whatItIs: '“Someone beat your score!”, “your team needs you!”',
    examples: ['leaderboards', '“your friend is waiting”'],
    whyItWorks: 'We care what friends think, so the game uses it to pull us back.',
    spotItQuestion: 'Is the game using my friends to make me feel I HAVE to play?',
    honestAlternative: 'Social fun happens in the room, with people present.',
    ageTier: 'core',
  },
  {
    id: 'sticky-exit',
    emoji: '🚪',
    kidName: 'The Sticky Exit',
    realName: 'Quitting friction',
    whatItIs: '“Are you SURE you want to leave?” plus the next round auto-starting.',
    examples: ['autoplay', 'scary quit warnings', 'hidden exit'],
    whyItWorks: 'It makes stopping harder than starting.',
    spotItQuestion: 'Is it harder to STOP than it was to start?',
    honestAlternative: 'Clean stopping points; one obvious exit; nothing auto-starts.',
    ageTier: 'core',
  },
  {
    id: 'money-door',
    emoji: '💰',
    kidName: 'The Money Door',
    realName: 'Pay-to-win / hidden costs',
    whatItIs: '“Free” game, but the good stuff costs, or payers win.',
    examples: ['pay-to-win upgrades', '“buy gems to continue”'],
    whyItWorks: 'It feels unfair and pressures us and our parents to spend.',
    spotItQuestion: 'Do I have to pay to do well, or is it fair for everyone?',
    honestAlternative: 'Never sell advantage; an equal field for all.',
    ageTier: 'core',
  },
  {
    id: 'too-far-to-quit',
    emoji: '📊',
    kidName: 'Too Far To Quit',
    realName: 'Sunk-cost / fake progress',
    whatItIs: '“You’re 90% there!”',
    examples: ['almost-full bars', '“one more level to unlock”'],
    whyItWorks: 'We hate feeling we wasted effort, so we push past fun.',
    spotItQuestion: 'Am I continuing because I want to, or to not waste progress?',
    honestAlternative: 'Progress reflects real skill — no fake “almost there”.',
    ageTier: 'older',
  },
  {
    id: 'one-step-behind',
    emoji: '🏃',
    kidName: 'Always One Step Behind',
    realName: 'Manufactured comparison',
    whatItIs: 'Rankings built so you always feel just behind.',
    examples: ['global ranks', 'tiers'],
    whyItWorks: 'Being “behind” feels bad, so we chase a number.',
    spotItQuestion: 'Is this making me feel never good enough?',
    honestAlternative: 'Compare you-to-yesterday, not you-to-strangers.',
    ageTier: 'older',
  },
  {
    id: 'constant-tap',
    emoji: '👆',
    kidName: 'The Constant Tap On The Shoulder',
    realName: 'Notification bait',
    whatItIs: 'Pings that pull you back on a schedule, not because anything real happened.',
    examples: ['“we miss you!”', '“your crops are ready!”'],
    whyItWorks: 'Every buzz grabs attention and interrupts you.',
    spotItQuestion: 'Did something REAL happen, or is it just poking me?',
    honestAlternative: 'No notifications; you decide when to play.',
    ageTier: 'older',
  },
  {
    id: 'sneaky-button',
    emoji: '🫥',
    kidName: 'The Sneaky Button',
    realName: 'Deceptive dark patterns',
    whatItIs: 'Huge bright “YES!”, tiny grey hidden “no thanks”.',
    examples: ['confusing pop-ups', 'pre-ticked boxes'],
    whyItWorks: 'It tricks us into clicking what they want, and teaches us not to read.',
    spotItQuestion: 'Is one choice made easy and the other made hard?',
    honestAlternative: 'Clear, equal-weight, honest choices.',
    ageTier: 'older',
  },
  {
    id: 'slowing-treadmill',
    emoji: '📉',
    kidName: 'The Slowing Treadmill',
    realName: 'Reward inflation',
    whatItIs: 'Generous early rewards that slow down so you play (or pay) more for the same feeling.',
    examples: ['generous early levels', 'then a grind wall'],
    whyItWorks: 'We chase the feeling we had at the start.',
    spotItQuestion: 'Did this used to be more rewarding? Am I just grinding?',
    honestAlternative: 'Consistent, honest reward for skill.',
    ageTier: 'older',
  },
];

export function trickById(id: string): Trick | undefined {
  return TRICKS.find((t) => t.id === id);
}

/** Shown across Learn screens — the single question that catches every trick. */
export const GOLDEN_QUESTION =
  'Is this making the game more FUN — or just harder to STOP? If it’s the second one, that’s a trick.';

// ---------- Trick Hunt scenarios (the same tricks, out in the wider world) ----------

export interface HuntScenario {
  context: 'Social media' | 'Shopping app' | 'Streaming' | 'Phone';
  text: string;
  trickId: string;
}

export const HUNT_SCENARIOS: HuntScenario[] = [
  { context: 'Streaming', text: 'The next video autoplays before you can decide to stop.', trickId: 'sticky-exit' },
  { context: 'Shopping app', text: 'A shop says “Only 2 left in stock — order soon!”', trickId: 'hurry-miss-out' },
  { context: 'Social media', text: 'A red badge shows “7 friends posted — see what you missed!”', trickId: 'friends-watching' },
  { context: 'Phone', text: 'An app you haven’t opened in a week buzzes: “We miss you!”', trickId: 'constant-tap' },
  { context: 'Shopping app', text: 'A pop-up has a giant “YES, save 50%!” and a tiny grey “no thanks”.', trickId: 'sneaky-button' },
  { context: 'Social media', text: 'You scroll and scroll and the feed never ends or stops.', trickId: 'sticky-exit' },
  { context: 'Streaming', text: 'A banner: “Your free trial ends in 24:00:00 — upgrade now!”', trickId: 'hurry-miss-out' },
  { context: 'Phone', text: 'A language app: “Don’t lose your 30-day streak — practise now!”', trickId: 'dont-break-chain' },
];

// ---------- Honest Game Promise (what we chose NOT to build) ----------

export interface PromiseItem {
  text: string;
  trickId: string;
}

export const HONEST_PROMISE: PromiseItem[] = [
  { text: 'No surprise prizes or loot boxes.', trickId: 'surprise-machine' },
  { text: 'No daily streaks to keep up.', trickId: 'dont-break-chain' },
  { text: 'No “hurry, limited time!” pressure.', trickId: 'hurry-miss-out' },
  { text: 'No notifications nagging you back.', trickId: 'constant-tap' },
  { text: 'No global leaderboards.', trickId: 'one-step-behind' },
  { text: 'No paying to win.', trickId: 'money-door' },
];
