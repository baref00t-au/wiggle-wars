// Tiny WebAudio sound effects synthesised from oscillators — no audio files, so
// there are zero network requests and nothing to download (fits the privacy /
// offline rules). Muted by default; unlocking happens on a user gesture, which
// browsers require before audio can start.

export type SfxName = 'count' | 'go' | 'death' | 'roundWin' | 'matchWin' | 'ui';

type AudioCtor = typeof AudioContext;

export class Sfx {
  private ctx: AudioContext | null = null;
  private muted: boolean;

  /** Initial muted state only sets the flag — the AudioContext is not created
   *  until a user gesture unlocks it (browsers require that). */
  constructor(muted = true) {
    this.muted = muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Toggle mute; returns the new muted state. */
  toggle(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!muted) this.unlock();
  }

  /** Create/resume the AudioContext. Call from within a user gesture. */
  unlock(): void {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  play(name: SfxName): void {
    if (this.muted) return;
    this.ensureContext();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    switch (name) {
      case 'count':
        this.tone(440, t, 0.09, 'square', 0.12);
        break;
      case 'go':
        this.tone(880, t, 0.28, 'square', 0.18);
        break;
      case 'death':
        this.sweep(340, 70, t, 0.45, 'sawtooth', 0.16);
        break;
      case 'roundWin':
        this.arpeggio([523, 659, 784], t, 0.11, 0.16);
        break;
      case 'matchWin':
        this.arpeggio([523, 659, 784, 1047], t, 0.14, 0.2);
        break;
      case 'ui':
        this.tone(620, t, 0.05, 'triangle', 0.08);
        break;
    }
  }

  private ensureContext(): void {
    if (this.ctx) return;
    const Ctor: AudioCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (Ctor) this.ctx = new Ctor();
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  private sweep(
    f0: number,
    f1: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, start);
    osc.frequency.exponentialRampToValueAtTime(f1, start + dur);
    gain.gain.setValueAtTime(peak, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  private arpeggio(freqs: number[], start: number, step: number, peak: number): void {
    freqs.forEach((f, i) => this.tone(f, start + i * step, step * 1.5, 'square', peak));
  }
}
