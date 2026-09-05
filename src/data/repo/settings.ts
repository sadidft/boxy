import { getDB } from '../db';
import { defaultSettings, type Settings } from '../types';

const KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const row = await getDB().settings.get(KEY);
  const stored = (row?.value as Partial<Settings> | undefined) ?? {};
  return { ...defaultSettings, ...stored, autoBackup: { ...defaultSettings.autoBackup, ...(stored.autoBackup ?? {}) } };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = getDB();
  const current = await loadSettings();
  const next: Settings = { ...current, ...patch };
  await db.settings.put({ key: KEY, value: next, updatedAt: Date.now() });
  return next;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await getDB().settings.get(key);
  return (row?.value as T | undefined) ?? fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await getDB().settings.put({ key, value, updatedAt: Date.now() });
}
