// Guardrails G1, G2, G4, G5, G6, G8 as a machine check for copy: i18n strings, content packs,
// README, docs, index.html and the manifest. Exit code 1 on any error.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

const targets = ['src/i18n', 'src/content', 'README.md', 'index.html', 'CONTRIBUTING.md', 'docs'];
const versionWhitelist = new Set(['docs/MASTERPLAN.md', 'docs/ISSUES_F0_F1.md', 'docs/SPEC_F0_F1.md', 'docs/regressions.md', 'CHANGELOG.md']);
const versionWhitelistDirs = ['docs/adr/'];
const skipDirs = ['docs/legacy/']; // verbatim copies of the previous app, kept for reference only

const rules = [
  { code: 'G1', level: 'error', re: /[\u2013\u2014]/u, message: 'em/en dash; use a comma, colon, parentheses or a new sentence' },
  { code: 'G2', level: 'error', re: /\p{Extended_Pictographic}|[\u2600-\u27BF]/u, message: 'emoji or pictograph; use a Lucide icon' },
  { code: 'G6', level: 'error', re: /[\u2026\u2713\u2714\u2717\u2718\u2605\u2606\u25CF\u25CB]/u, message: 'decorative typography glyph; use plain characters or a Lucide icon' },
  { code: 'G8', level: 'error', re: /\b(v\s?\d+(\.\d+)+|Boxy\s?\d|Reborn|BoxyVerde|version\s+\d)\b/i, message: 'product version label; Boxy has no version (calendar build id only)' },
];
const hype = JSON.parse(readFileSync(resolve(root, 'scripts/lint-copy.words.json'), 'utf8'));
const glossary = existsSync(resolve(root, 'docs/glossary.md')) ? parseGlossary(readFileSync(resolve(root, 'docs/glossary.md'), 'utf8')) : [];

function parseGlossary(md) {
  // Lines under "## Forbidden" shaped like: - `folder` -> Box
  const out = [];
  const section = md.split(/^## Forbidden/m)[1] || '';
  for (const line of section.split('\n')) {
    const m = line.match(/^- `([^`]+)`\s*->\s*(.+)$/);
    if (m) out.push({ term: m[1], use: m[2].trim() });
  }
  return out;
}

const files = [];
function collect(p) {
  const abs = resolve(root, p);
  if (!existsSync(abs)) return;
  const st = statSync(abs);
  if (st.isDirectory()) {
    for (const e of readdirSync(abs)) if (!e.startsWith('.')) collect(join(p, e));
  } else if (/\.(json|md|html|webmanifest|txt)$/.test(abs)) files.push(abs);
}
targets.forEach(collect);

let errors = 0;
let warnings = 0;
let exceptions = 0;
const report = (level, file, line, code, msg) => {
  const rel = relative(root, file);
  console.log(`${rel}:${line}  ${code}  ${msg}`);
  if (level === 'error') errors += 1;
  else warnings += 1;
};

for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (skipDirs.some((d) => rel.startsWith(d))) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const isI18n = rel.startsWith('src/i18n/');
  const isCopy = isI18n || rel.startsWith('src/content/');
  const versionExempt = versionWhitelist.has(rel) || versionWhitelistDirs.some((d) => rel.startsWith(d));

  lines.forEach((line, idx) => {
    const prev = lines[idx - 1] || '';
    const excepted = /guardrail-exception:/.test(prev) || /guardrail-exception:/.test(line) || /"_guardrail_exception"/.test(line);
    if (excepted) {
      exceptions += 1;
      return;
    }
    // Skip fenced code lines in markdown that only document regexes (they legitimately contain escaped ranges).
    if (/\\u20(13|14|26)|\\p\{Extended_Pictographic\}/.test(line)) return;
    for (const r of rules) {
      if (r.code === 'G8' && versionExempt) continue;
      if (r.re.test(line)) report(r.level, file, idx + 1, r.code, r.message);
    }
    if (isCopy) {
      for (const w of hype.words) {
        const re = new RegExp(`\\b${w}\\b`, 'i');
        if (re.test(line)) report('error', file, idx + 1, 'G4', `hype word "${w}"; state the concrete fact instead`);
      }
      for (const g of glossary) {
        const re = new RegExp(`\\b${g.term}\\b`, 'i');
        if (re.test(line)) report('error', file, idx + 1, 'G5', `term "${g.term}" is not in the glossary; use ${g.use}`);
      }
    }
  });

  if (isI18n) {
    // Sentence length check on string values only.
    try {
      const walk = (obj, path) => {
        for (const [k, v] of Object.entries(obj)) {
          if (k === '_guardrail_exception') continue;
          if (typeof v === 'string') {
            for (const sentence of v.split(/(?<=[.!?])\s+/)) {
              const words = sentence.trim().split(/\s+/).filter(Boolean).length;
              if (words > 25) report('warning', file, 0, 'G4', `${path}${k}: sentence has ${words} words (max 25)`);
            }
          } else if (v && typeof v === 'object') walk(v, `${path}${k}.`);
        }
      };
      walk(JSON.parse(text), '');
    } catch (e) {
      report('error', file, 0, 'JSON', `invalid JSON: ${e.message}`);
    }
  }
}

console.log(`lint-copy: ${files.length} files, ${errors} error(s), ${warnings} warning(s), ${exceptions} documented exception(s)`);
if (args.has('--report')) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync(resolve(root, 'reports'), { recursive: true });
  writeFileSync(resolve(root, 'reports/guardrails.json'), JSON.stringify({ files: files.length, errors, warnings, exceptions, at: new Date().toISOString() }, null, 2));
}
process.exit(errors ? 1 : 0);
