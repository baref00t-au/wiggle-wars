// Seeded PRNG (mulberry32). Deterministic and fully serializable: `state` is a
// 32-bit integer, so spawns and any future random sim events reproduce exactly
// from a seed. NEVER use Math.random() in the simulation — it would break both
// the determinism tests and networked play.

export class Rng {
  state: number;

  constructor(seed: number) {
    // `| 0` is idempotent for an int32, so this also accepts a restored state.
    this.state = seed | 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Next float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Next integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
}
