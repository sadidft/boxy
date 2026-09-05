// Renders PWA icons, favicons, apple-touch-icon and the social image from public/logo.svg.
// Everything derives from the recoloured original; nothing is drawn by hand.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'brand/tokens.json'), 'utf8'));
const dark = tokens.themes.dark;
const logo = readFileSync(resolve(root, 'public/logo.svg'), 'utf8');
const mono = readFileSync(resolve(root, 'public/logo-mono.svg'), 'utf8');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const vb = logo.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const [vx, vy, vw, vh] = vb;
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// Compose the logo centred in a square canvas. scale = fraction of the canvas the logo's height takes.
function compose(size, { bg = 'none', scale = 0.86, svg = logo, color } = {}) {
  const h = vh * 1;
  const w = vw * 1;
  const s = (size * scale) / Math.max(w, h);
  const tx = (size - w * s) / 2 - vx * s;
  const ty = (size - h * s) / 2 - vy * s;
  const colorAttr = color ? ` color="${color}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"${colorAttr}>` +
    (bg !== 'none' ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : '') +
    `<g transform="translate(${tx} ${ty}) scale(${s})">${inner(svg)}</g></svg>`;
}

const png = (svg, size, file) => {
  const data = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: 'transparent' }).render().asPng();
  writeFileSync(resolve(outDir, file), data);
  return data.length;
};

let total = 0;
for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) total += png(compose(size), size, `icon-${size}.png`);
for (const size of [192, 512]) total += png(compose(size, { bg: dark.bg, scale: 0.6 }), size, `maskable-${size}.png`);
total += png(compose(180, { bg: dark.bg, scale: 0.7 }), 180, 'apple-touch-icon.png');
for (const size of [16, 32]) total += png(compose(size, { svg: mono, color: dark.accent, scale: 0.98 }), size, `favicon-${size}.png`);

// Shortcut icons: Lucide glyphs (plus, search) on the brand background, monochrome accent stroke.
const lucide = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
};
for (const [name, body] of Object.entries(lucide)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="${dark.bg}"/><g transform="translate(24 24) scale(2)" fill="none" stroke="${dark.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
  total += png(svg, 96, `shortcut-${name}.png`);
}

// Social preview 1200x630: logo + wordmark + tagline. resvg cannot read woff2, so brand/fonts holds
// TTF copies of the two faces (generated once with wawoff2 from public/fonts). The render is fully offline.
const fontDir = resolve(root, 'brand/fonts');
const fontFiles = ['IBMPlexMono-400-latin.ttf', 'InstrumentSerif-400-italic-latin.ttf'].map((f) => resolve(fontDir, f)).filter(existsSync);
if (fontFiles.length !== 2) console.warn('[brand] warning: brand/fonts TTF files missing, og-image text will not render');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${dark.bg}"/>
  <g transform="translate(110 135) scale(${(360 / vh).toFixed(5)}) translate(${-vx} ${-vy})">${inner(logo)}</g>
  <text x="470" y="300" font-family="Instrument Serif" font-style="italic" font-size="120" fill="${dark.text}">Boxy</text>
  <text x="474" y="372" font-family="IBM Plex Mono" font-size="34" fill="${dark.accent}">Your snippets, offline first.</text>
  <text x="474" y="430" font-family="IBM Plex Mono" font-size="22" fill="${dark.textMuted}">boxy.sadid.my.id</text>
</svg>`;
const ogPng = new Resvg(og, { fitTo: { mode: 'width', value: 1200 }, font: { fontFiles, loadSystemFonts: false } }).render().asPng();
writeFileSync(resolve(root, 'public/og-image.png'), ogPng);
total += ogPng.length;

console.log(`[brand] icons written to public/icons and public/og-image.png (${(total / 1024).toFixed(0)} KB total)`);
