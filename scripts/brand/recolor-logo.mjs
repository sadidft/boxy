// Recolours the original Boxy logo. Geometry is never touched (guardrail G7):
// only the fill attribute of the six visible faces changes, mapped by index.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'brand/tokens.json'), 'utf8'));
const source = readFileSync(resolve(root, 'brand/logo.source.svg'), 'utf8');

const { sourceFills, fills, hidden } = tokens.logo;
if (sourceFills.length !== fills.length) throw new Error('logo.sourceFills and logo.fills must have the same length');

function replaceFills(svg, mapper) {
  let out = svg;
  sourceFills.forEach((from, i) => {
    const re = new RegExp(`fill="${from}"`, 'g');
    const count = (out.match(re) || []).length;
    if (count !== 1) throw new Error(`expected exactly one path with fill ${from}, found ${count}`);
    out = out.replace(re, `fill="${mapper(i)}"`);
  });
  return out;
}

// Vector-tool leftovers that are safe to drop: inline visibility styles and data-index attributes.
// Path data, viewBox, opacity and stroke attributes are preserved byte for byte.
const clean = (svg) =>
  svg
    .replace(/\s+style="[^"]*"/g, '')
    .replace(/\s+data-index="\d+"/g, '')
    .replace(/\s+enable-background="[^"]*"/, '')
    .replace(/\s+xml:space="preserve"/, '')
    .replace(/\s+id="Layer_1"/, '')
    .replace(/\s+x="0px"\s+y="0px"/, '')
    .replace(/<svg /, '<svg role="img" aria-label="Boxy" ');

const brand = clean(replaceFills(source, (i) => fills[i]));
const mono = clean(replaceFills(source, () => 'currentColor'));

// Hidden helper paths from the original file stay in place (with their original fills) and stay hidden:
// they are kept so the path list is identical to the source, but rendered invisible via fill-opacity.
const hideHidden = (svg) => hidden.reduce((s, h) => s.replace(`fill="${h}"`, `fill="${h}" fill-opacity="0"`), svg);

mkdirSync(resolve(root, 'public/icons'), { recursive: true });
writeFileSync(resolve(root, 'public/logo.svg'), hideHidden(brand));
writeFileSync(resolve(root, 'public/logo-mono.svg'), hideHidden(mono));
writeFileSync(resolve(root, 'public/icons/icon.svg'), hideHidden(brand));
console.log('[brand] public/logo.svg, public/logo-mono.svg, public/icons/icon.svg written');
