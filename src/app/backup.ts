import i18n from '@/i18n';
import { toast } from '@/app/ui-store';
import { useSettings } from '@/app/settings-store';
import { buildExport, exportFileName, isBoxyFormat2, type BoxyExport } from '@/data/export/json';
import { applyBoxyImport, previewBoxyImport, type ImportPreview } from '@/data/import/json';
import { parseLegacy, planLegacyImport, LegacyParseError, type LegacyParsed, type LegacyPlan, type LegacyPlanOptions } from '@/data/import/legacy';
import { applyLegacyPlan } from '@/data/import/apply';
import { flushProjections } from '@/data/store';
import { getDB } from '@/data/db';
import type { MigrationLog } from '@/data/types';

export function downloadText(name: string, text: string, type = 'application/json'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function exportAll(): Promise<string> {
  await flushProjections();
  const exp = await buildExport('full');
  const name = exportFileName('full');
  downloadText(name, JSON.stringify(exp, null, 2));
  toast(i18n.t('import.exported', { file: name }), { kind: 'success' });
  return name;
}

export async function exportBox(boxId: string, boxName: string): Promise<string> {
  await flushProjections(boxId);
  const exp = await buildExport('box', boxId);
  const name = exportFileName('box', boxName);
  downloadText(name, JSON.stringify(exp, null, 2));
  toast(i18n.t('import.exported', { file: name }), { kind: 'success' });
  return name;
}

/** Safety net before destructive imports: a download of everything that exists right now. */
export async function backupBeforeReplace(): Promise<string | undefined> {
  const count = await getDB().cards_index.count();
  if (count === 0) return undefined;
  return exportAll();
}

/** Daily snapshot kept in Dexie settings as text (small data sets) so a broken browser profile can still be recovered from the Settings page. */
export async function snapshotNow(): Promise<void> {
  await flushProjections();
  const exp = await buildExport('full');
  const json = JSON.stringify(exp);
  const db = getDB();
  const key = `snapshot.${new Date().toISOString().slice(0, 10)}`;
  await db.settings.put({ key, value: json, updatedAt: Date.now() });
  const all = (await db.settings.where('key').startsWith('snapshot.').primaryKeys()).sort();
  for (const old of all.slice(0, Math.max(0, all.length - 7))) await db.settings.delete(old);
  await useSettings.getState().update({ autoBackup: { ...useSettings.getState().settings.autoBackup, lastAt: Date.now(), lastFile: key } });
}

export async function maybeDailySnapshot(): Promise<void> {
  const { settings } = useSettings.getState();
  if (!settings.autoBackup.enabled) return;
  const last = settings.autoBackup.lastAt ?? 0;
  if (Date.now() - last < 20 * 3_600_000) return;
  const count = await getDB().cards_index.count();
  if (count === 0) return;
  try {
    await snapshotNow();
  } catch {
    // best effort
  }
}

export async function listSnapshots(): Promise<{ key: string; bytes: number }[]> {
  const db = getDB();
  const rows = await db.settings.where('key').startsWith('snapshot.').toArray();
  return rows.map((r) => ({ key: r.key, bytes: typeof r.value === 'string' ? r.value.length : 0 })).sort((a, b) => b.key.localeCompare(a.key));
}

export async function downloadSnapshot(key: string): Promise<void> {
  const row = await getDB().settings.get(key);
  if (!row || typeof row.value !== 'string') return;
  downloadText(`boxy-${key.replace('snapshot.', 'snapshot-')}.json`, row.value);
}

export type Detected = { kind: 'boxy'; data: BoxyExport; preview: ImportPreview } | { kind: 'legacy'; parsed: LegacyParsed } | { kind: 'invalid'; reason: string };

export async function detectImport(text: string): Promise<Detected> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { kind: 'invalid', reason: 'json' };
  }
  if (isBoxyFormat2(data)) {
    const preview = await previewBoxyImport(data);
    if (preview) return { kind: 'boxy', data: data as BoxyExport, preview };
  }
  try {
    const parsed = parseLegacy(data);
    return { kind: 'legacy', parsed };
  } catch (e) {
    return { kind: 'invalid', reason: e instanceof LegacyParseError ? e.message : 'unknown' };
  }
}

export async function runLegacyImport(parsed: LegacyParsed, opts: LegacyPlanOptions, kind: MigrationLog['kind'], source: string): Promise<{ plan: LegacyPlan; log: MigrationLog }> {
  const plan = await planLegacyImport(parsed, opts);
  const { log } = await applyLegacyPlan(plan, { kind, source });
  const settings = useSettings.getState();
  if (!settings.settings.lastBoxId && plan.boxes[0]) await settings.update({ lastBoxId: plan.boxes[0].id });
  return { plan, log };
}

export async function runBoxyImport(data: BoxyExport, mode: 'merge' | 'replace', source: string): Promise<MigrationLog> {
  let backupFile: string | undefined;
  if (mode === 'replace') backupFile = await backupBeforeReplace();
  const log = await applyBoxyImport(data, mode, source);
  if (backupFile) log.backupFile = backupFile;
  return log;
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
}
