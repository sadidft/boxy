// A stand-in for the previous Boxy on a second origin. It holds the real legacy fixtures in localStorage and speaks
// the handoff protocol (SPEC §7.4): waits for `boxy-handoff-ready`, answers with `boxy-handoff-data`, records the receipt.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, '..', 'docs', 'legacy');
const APP = process.env.E2E_APP_ORIGIN ?? 'http://localhost:4173';
const PORT = Number(process.env.E2E_LEGACY_PORT ?? 8099);

const page = () => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>previous Boxy</title></head><body>
<h1>Previous Boxy</h1>
<button id="go">Move my data to the new Boxy</button>
<pre id="log"></pre>
<script>
  const log = (m) => { document.getElementById('log').textContent += m + '\\n'; };
  localStorage.setItem('boxy_data_v1', ${JSON.stringify(fs.readFileSync(path.join(fixtures, 'fixture-storage.json'), 'utf8'))});
  localStorage.setItem('boxy_minimal_backup', ${JSON.stringify(fs.readFileSync(path.join(fixtures, 'fixture-minimal-backup.json'), 'utf8'))});
  let win = null;
  window.addEventListener('message', (e) => {
    if (e.origin !== ${JSON.stringify(APP)}) { log('ignored ' + e.origin); return; }
    const d = e.data || {};
    if (d.type === 'boxy-handoff-ready') {
      log('ready');
      win.postMessage({ type: 'boxy-handoff-data', nonce: d.nonce, payload: { primary: localStorage.getItem('boxy_data_v1'), backup: localStorage.getItem('boxy_minimal_backup') }, sentAt: Date.now() }, e.origin);
    } else if (d.type === 'boxy-handoff-received') {
      log('received ' + JSON.stringify(d.counts));
      document.title = 'handoff-done';
      window.__receipt = d.counts;
    }
  });
  document.getElementById('go').addEventListener('click', () => { win = window.open(${JSON.stringify(APP + '/import/handoff')}, '_blank'); });
</script></body></html>`;

// /rogue: an origin that is not allow-listed; it must never receive `ready` and its data must be ignored.
const rogue = () => `<!doctype html><html><head><meta charset="utf-8"><title>waiting</title></head><body><script>
  window.__gotReady = false;
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'boxy-handoff-ready') window.__gotReady = true;
    if (e.data && e.data.type === 'boxy-handoff-received') document.title = 'accepted';
  });
  const w = window.open(${JSON.stringify(APP + '/import/handoff')}, '_blank');
  setTimeout(() => {
    w.postMessage({ type: 'boxy-handoff-data', nonce: 'guess', payload: { primary: '{"boxes":[],"tabs":[],"cards":[]}' } }, '*');
    setTimeout(() => { if (document.title !== 'accepted') document.title = 'rejected'; }, 1500);
  }, 1500);
</script></body></html>`;

const handler = (req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(req.url?.startsWith('/rogue') ? rogue() : page());
};
http.createServer(handler).listen(PORT, '127.0.0.1', () => console.log(`legacy stand-in on http://127.0.0.1:${PORT}`));
// The rogue page lives on a second port so that its origin is not allow-listed.
http.createServer(handler).listen(PORT - 1, '127.0.0.1', () => console.log(`rogue origin on http://127.0.0.1:${PORT - 1}`));
