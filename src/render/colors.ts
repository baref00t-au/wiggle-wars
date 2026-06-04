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

export const PALETTE: PlayerColor[] = [
  { name: 'Blue', line: '#56B4E9', head: '#A8DCF6', shape: 'circle', glyph: '●' },
  { name: 'Orange', line: '#E69F00', head: '#FFC94D', shape: 'triangle', glyph: '▲' },
  { name: 'Green', line: '#009E73', head: '#5FD7B4', shape: 'square', glyph: '■' },
  { name: 'Yellow', line: '#F0E442', head: '#F8F19A', shape: 'diamond', glyph: '◆' },
  { name: 'Red', line: '#D55E00', head: '#FF9A57', shape: 'star', glyph: '★' },
  { name: 'Purple', line: '#CC79A7', head: '#E9B6D2', shape: 'hexagon', glyph: '⬢' },
];

export const ARENA_FILL = '#15172a';
export const ARENA_BORDER = '#3a3f63';

export function colorFor(index: number): PlayerColor {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}
