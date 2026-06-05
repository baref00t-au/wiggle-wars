// Player palette + arena colours. This is the ONLY place colours live; the sim
// refers to players by colorIndex and stays colour-agnostic.
//
// Built on the Okabe-Ito colour-blind-safe palette so the lines stay
// distinguishable for the common forms of colour-vision deficiency on a dark
// arena. `head` is a lighter tint of `line` for the brighter live head.

/** A non-colour marker per player, so colour is never the only way to tell lines
 *  apart (accessibility). Drawn on the head; the glyph mirrors it in the HUD. */
export type PlayerShape = 'circle' | 'triangle' | 'square' | 'diamond' | 'star' | 'hexagon';

export interface PlayerColor {
  /** Friendly name for the HUD ("Player Blue wins!"). */
  name: string;
  /** Trail stroke colour. */
  line: string;
  /** Brighter head colour. */
  head: string;
  /** Secondary, non-colour identity marker. */
  shape: PlayerShape;
  /** Unicode glyph of the shape, for the scoreboard. */
  glyph: string;
}

interface ColorDef {
  name: string;
  line: string;
  head: string;
}

const COLORS: ColorDef[] = [
  { name: 'Blue', line: '#56B4E9', head: '#A8DCF6' },
  { name: 'Orange', line: '#E69F00', head: '#FFC94D' },
  { name: 'Green', line: '#009E73', head: '#5FD7B4' },
  { name: 'Yellow', line: '#F0E442', head: '#F8F19A' },
  { name: 'Red', line: '#D55E00', head: '#FF9A57' },
  { name: 'Purple', line: '#CC79A7', head: '#E9B6D2' },
];

const SHAPES: { shape: PlayerShape; glyph: string }[] = [
  { shape: 'circle', glyph: '●' },
  { shape: 'triangle', glyph: '▲' },
  { shape: 'square', glyph: '■' },
  { shape: 'diamond', glyph: '◆' },
  { shape: 'star', glyph: '★' },
  { shape: 'hexagon', glyph: '⬢' },
];

/** The colour choices offered in the same-device menu (one per base colour). */
export const PALETTE = COLORS;

export const ARENA_FILL = '#15172a';
export const ARENA_BORDER = '#3a3f63';

/**
 * Identity for player `index`. The first 6 are the distinct colour+shape pairs
 * (Blue circle, Orange triangle, …). Beyond that, colour and shape advance on a
 * diagonal so every (colour, shape) pair is unique — 6×6 = 36 distinct identities,
 * enough for big WiFi/online games, all using the colour-blind-safe colours.
 */
export function colorFor(index: number): PlayerColor {
  const n = COLORS.length;
  const ci = ((index % n) + n) % n;
  const si = (((ci + Math.floor(index / n)) % SHAPES.length) + SHAPES.length) % SHAPES.length;
  const c = COLORS[ci];
  const s = SHAPES[si];
  return { name: c.name, line: c.line, head: c.head, shape: s.shape, glyph: s.glyph };
}
