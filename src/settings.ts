// Local, on-device settings persistence. Stored in localStorage only — nothing is
// ever transmitted, and no nicknames are kept (names are per-match and could be a
// child's, plus a shared classroom device shouldn't pre-fill the previous group).
// All access is wrapped in try/catch because locked-down school devices / private
// mode can make localStorage throw or be absent; we silently fall back to defaults.

export interface StoredSettings {
  muted: boolean;
  count: number;
  colorIndices: number[];
  targetScore: number;
}

const KEY = 'wiggle-wars:v1';

const DEFAULTS: StoredSettings = {
  muted: true,
  count: 2,
  colorIndices: [0, 1, 2, 3],
  targetScore: 5,
};

function clampCount(n: unknown): number {
  const v = Number(n);
  return v === 2 || v === 3 || v === 4 ? v : DEFAULTS.count;
}

export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULTS.muted,
      count: clampCount(parsed.count),
      colorIndices:
        Array.isArray(parsed.colorIndices) && parsed.colorIndices.length >= 4
          ? parsed.colorIndices.slice(0, 4).map((n) => Number(n) || 0)
          : [...DEFAULTS.colorIndices],
      targetScore:
        typeof parsed.targetScore === 'number' ? parsed.targetScore : DEFAULTS.targetScore,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function patchSettings(patch: Partial<StoredSettings>): void {
  try {
    const next = { ...loadSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (locked-down device / private mode) — settings just
    // won't persist this session. The game still works.
  }
}
