// Renders the source images @capacitor/assets needs (1024px icons, 2732px splash)
// from public/icon.svg, so the Android launcher icon matches the PWA icon.
// Run: node assets/generate-sources.mjs && npx capacitor-assets generate --android
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const BG = '#0e0f1a';
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
// Foreground-only variant: same art, transparent background (adaptive icon layer).
const fgSvg = svg.replace(/<rect[^>]*\/>/, '');

const png = (src, size, density = 300) =>
  sharp(Buffer.from(src), { density }).resize(size, size).png().toBuffer();

// Full icon (legacy launcher / Play listing).
await sharp(await png(svg, 1024)).toFile('assets/icon-only.png');
// Adaptive icon layers: the OS masks the outer ~1/6, so shrink art into a safe zone.
const fg = await png(fgSvg, 680);
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: fg, gravity: 'centre' }]).png().toFile('assets/icon-foreground.png');
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } })
  .png().toFile('assets/icon-background.png');
// Splash: dark ground with the icon centred (same for light/dark).
const splashArt = await png(fgSvg, 900);
const splash = sharp({ create: { width: 2732, height: 2732, channels: 4, background: BG } })
  .composite([{ input: splashArt, gravity: 'centre' }]).png();
await splash.clone().toFile('assets/splash.png');
await splash.clone().toFile('assets/splash-dark.png');
console.log('assets/ sources written');
