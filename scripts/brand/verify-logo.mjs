// Guardrail G7: the logo geometry is immutable. This script fails CI when any generated logo
// differs from brand/logo.source.svg in anything other than fill colour.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync } from 'svgson';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tokens = JSON.parse(readFileSync(resolve(root, 'brand/tokens.json'), 'utf8'));
const allowed = new Set([...tokens.logo.fills, ...tokens.logo.hidden, 'currentColor'].map((s) => s.toLowerCase()));

const paths = (file) => {
  const ast = parseSync(readFileSync(resolve(root, file), 'utf8'));
  const list = [];
  const walk = (n) => {
    if (n.name === 'path') list.push(n.attributes);
    (n.children || []).forEach(walk);
  };
  walk(ast);
  return { viewBox: ast.attributes.viewBox, list };
};

const src = paths('brand/logo.source.svg');
let failures = 0;
const fail = (m) => {
  failures += 1;
  console.error('[brand:verify] FAIL', m);
};

for (const file of ['public/logo.svg', 'public/logo-mono.svg', 'public/icons/icon.svg']) {
  const out = paths(file);
  if (out.viewBox !== src.viewBox) fail(`${file}: viewBox changed (${out.viewBox} vs ${src.viewBox})`);
  if (out.list.length !== src.list.length) fail(`${file}: path count ${out.list.length} vs ${src.list.length}`);
  out.list.forEach((p, i) => {
    const s = src.list[i];
    if (!s) return;
    if (p.d !== s.d) fail(`${file}: path ${i} geometry differs`);
    if ((p.opacity ?? '') !== (s.opacity ?? '')) fail(`${file}: path ${i} opacity differs`);
    if ((p.stroke ?? '') !== (s.stroke ?? '')) fail(`${file}: path ${i} stroke differs`);
    if (!allowed.has((p.fill || '').toLowerCase())) fail(`${file}: path ${i} fill ${p.fill} not in the allowed list`);
    const isHidden = tokens.logo.hidden.includes(s.fill);
    if (isHidden && p['fill-opacity'] !== '0') fail(`${file}: hidden path ${i} must keep fill-opacity 0`);
    const extra = Object.keys(p).filter((k) => !['d', 'fill', 'opacity', 'stroke', 'fill-opacity'].includes(k));
    if (extra.length) fail(`${file}: path ${i} has unexpected attributes ${extra.join(',')}`);
  });
}

if (failures) {
  console.error(`[brand:verify] ${failures} problem(s). The logo geometry must stay identical to brand/logo.source.svg.`);
  process.exit(1);
}
console.log('[brand:verify] OK: geometry identical, fills within the palette');
