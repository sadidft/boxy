// Builds authentic fixtures by running the storage module of the previous Boxy (git tag legacy-1.0.23)
// in Node with a fake localStorage. Usage: node scripts/fixtures/make-legacy.mjs [path-to-legacy-checkout]
// Output: docs/legacy/fixture-*.json (storage payload, full export, single box export, minimal backup).
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const legacyRoot = process.argv[2] ?? path.join(os.tmpdir(), 'legacy');
if (!fs.existsSync(path.join(legacyRoot, 'src', 'store', 'storage.ts'))) {
  console.error(`Legacy checkout not found at ${legacyRoot}. Run: git archive legacy-1.0.23 | tar -x -C ${legacyRoot}`);
  process.exit(1);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'boxy-fixture-'));
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(
  entry,
  `import { loadState, saveState, exportAllData, exportBox } from '@/store/storage';
import { generateId } from '@/utils/helpers';
export function run(now) {
  const state = loadState();
  const box = state.boxes[0];
  const tab = { id: generateId('tab'), boxId: box.id, name: 'Hours', icon: 'clock', pinned: false, order: 9, createdAt: now, updatedAt: now };
  state.tabs.push(tab);
  state.cards.push({
    id: generateId('card'), tabId: tab.id, title: 'Weekly hours', content: 'Hours worked this week.', tags: ['time', 'Time'], pinned: true, copyCount: 3, order: 0, createdAt: now, updatedAt: now,
    history: [{ timestamp: now - 1000, action: 'copied' }],
    table: { mode: 'custom',
      columns: [{ id: 'c1', name: 'Day', order: 0 }, { id: 'c2', name: 'Start', order: 1 }, { id: 'c3', name: 'End', order: 2 }, { id: 'c4', name: 'Hours', order: 3 }],
      rows: [
        { id: 'r1', cells: { c1: 'Mon', c2: '09:00', c3: '17:30', c4: '8.5' }, order: 0 },
        { id: 'r2', cells: { c1: 'Tue', c2: '10:00', c3: '16:00', c4: '6' }, order: 1 },
        { id: 'r3', cells: { c1: '', c2: '', c3: 'dur//all', c4: 'sum//all' }, order: 2 },
      ] },
  });
  state.cards.push({ id: generateId('card'), tabId: tab.id, title: 'Invoice line', content: 'Invoice {{number}} for {{client}} due {{date}}', tags: ['invoice'], pinned: false, copyCount: 0, order: 1, createdAt: now, updatedAt: now, history: [], table: null });
  saveState(state);
  return { storage: localStorage.getItem('boxy_data_v1') ?? '', minimal: localStorage.getItem('boxy_minimal_backup'), full: exportAllData(state), box: exportBox(state, box.id) };
}
`,
);
const outfile = path.join(tmp, 'out.mjs');
await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile, alias: { '@': path.join(legacyRoot, 'src') }, logLevel: 'error', nodePaths: [path.join(repo, 'node_modules')] });

const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear(), key: (i) => [...store.keys()][i] ?? null, get length() { return store.size; } };
globalThis.window = globalThis;
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };
const FIXED_NOW = Date.UTC(2026, 0, 15, 9, 0, 0);
const realNow = Date.now;
Date.now = () => FIXED_NOW;
const m = await import(outfile);
const out = m.run(FIXED_NOW);
Date.now = realNow;
const dest = path.join(repo, 'docs', 'legacy');
fs.mkdirSync(dest, { recursive: true });
const files = { 'fixture-storage.json': out.storage, 'fixture-export-full.json': out.full, 'fixture-export-box.json': out.box, 'fixture-minimal-backup.json': out.minimal ?? 'null' };
for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dest, name), text.endsWith('\n') ? text : `${text}\n`);
console.log(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, `${v.length} bytes`])));
fs.rmSync(tmp, { recursive: true, force: true });
