// On-device-only storage for Learn (privacy §7). Everything here lives in this
// browser and is never transmitted. `clearAllData` wipes every Wiggle Wars key,
// including game settings — the visible "Clear everything on this device" control.

const PREFIX = 'wiggle-wars:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — feature just won't persist */
  }
}

export type AudienceTier = 'younger' | 'older';

export interface MyDesign {
  trickId: string;
  honestIdea: string;
  promise: string;
}

export interface SkillStat {
  /** YYYY-M-D the "best today" was set, so it resets on a new day. */
  day: string;
  bestTicksToday: number;
}

export const store = {
  audience(): AudienceTier {
    return read<AudienceTier>('audience', 'younger');
  },
  setAudience(tier: AudienceTier): void {
    write('audience', tier);
  },

  reducedMotion(): boolean {
    return read<boolean>('reduced-motion', false);
  },
  setReducedMotion(on: boolean): void {
    write('reduced-motion', on);
    applyReducedMotion(on);
  },

  designs(): MyDesign[] {
    return read<MyDesign[]>('designs', []);
  },
  addDesign(d: MyDesign): void {
    const all = this.designs();
    all.push(d);
    write('designs', all);
  },

  skill(): SkillStat | null {
    return read<SkillStat | null>('skill', null);
  },
  setSkill(s: SkillStat): void {
    write('skill', s);
  },
};

/** Apply the reduced-motion preference to the document (CSS reads the class). */
export function applyReducedMotion(on: boolean): void {
  document.documentElement.classList.toggle('reduced-motion', on);
}

/** Wipe every on-device Wiggle Wars value (settings + Learn data). */
export function clearAllData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing to clear / storage unavailable */
  }
}
