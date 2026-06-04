// Tiny shared kit for the Learn modes.
export { el } from '../ui/dom';

export type Cleanup = (() => void) | void;
export type Back = () => void;
/** A Learn mode renders itself into `host` and calls `back()` to return to the hub. */
export type ModeRenderer = (host: HTMLElement, back: Back) => Cleanup;
