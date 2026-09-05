// Generates src/styles/tokens.css and src/styles/tokens.ts from brand/tokens.json.
// Single source of truth for every colour in the app (guardrail G7: no raw colours outside tokens).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'brand/tokens.json'), 'utf8'));

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

let css = `/* GENERATED FILE. Do not edit. Source: brand/tokens.json (npm run brand). */\n`;
for (const [theme, values] of Object.entries(tokens.themes)) {
  const selector = theme === 'dark' ? ':root, [data-theme="dark"]' : `[data-theme="${theme}"]`;
  css += `${selector} {\n`;
  for (const [k, v] of Object.entries(values)) css += `  --${kebab(k)}: ${v};\n`;
  css += `  color-scheme: ${theme === 'light' ? 'light' : 'dark'};\n}\n`;
}
css += `:root {\n`;
for (const [k, v] of Object.entries(tokens.labels)) css += `  --label-${k}: ${v};\n`;
for (const [k, v] of Object.entries(tokens.radius)) css += `  --radius-${k}: ${v}px;\n`;
for (const [k, v] of Object.entries(tokens.font)) css += `  --font-${k}: ${v};\n`;
css += `  --font-body: var(--font-ui);\n`;
for (const [k, v] of Object.entries(tokens.motion)) css += `  --motion-${kebab(k)}: ${typeof v === 'number' ? v + 'ms' : v};\n`;
css += `}\n`;

let ts = `// GENERATED FILE. Do not edit. Source: brand/tokens.json (npm run brand).\n`;
ts += `export const themeNames = ${JSON.stringify(Object.keys(tokens.themes))} as const;\n`;
ts += `export type ThemeName = (typeof themeNames)[number];\n`;
ts += `export const labelColors = ${JSON.stringify(Object.keys(tokens.labels))} as const;\n`;
ts += `export type LabelColor = (typeof labelColors)[number];\n`;
ts += `export const labelHex: Record<LabelColor, string> = ${JSON.stringify(tokens.labels, null, 2)};\n`;
ts += `export const themeColors = ${JSON.stringify(
  Object.fromEntries(Object.entries(tokens.themes).map(([t, v]) => [t, { bg: v.bg, accent: v.accent, text: v.text }])),
  null,
  2,
)} as const;\n`;
ts += `export const logoFills = ${JSON.stringify(tokens.logo.fills)} as const;\n`;

mkdirSync(resolve(root, 'src/styles'), { recursive: true });
writeFileSync(resolve(root, 'src/styles/tokens.css'), css);
writeFileSync(resolve(root, 'src/styles/tokens.ts'), ts);
console.log('[brand] tokens.css and tokens.ts written');
