import { create } from 'zustand';
import { loadSettings, saveSettings } from '@/data/repo/settings';
import { defaultSettings, type Settings, type ThemeSetting } from '@/data/types';
import { detectLocale, setLocale, type Locale } from '@/i18n';
import { themeColors, type ThemeName } from '@/styles/tokens';

interface SettingsState {
  settings: Settings;
  ready: boolean;
  resolvedTheme: ThemeName;
  locale: Locale;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const THEME_KEY = 'boxy.theme';
const media = typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function resolveTheme(setting: ThemeSetting): ThemeName {
  if (setting === 'system') return media?.matches === false ? 'light' : 'dark';
  return setting;
}

function applyToDocument(settings: Settings, theme: ThemeName, locale: Locale): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-density', settings.density);
  root.setAttribute('data-reading-font', String(settings.readingFont));
  root.setAttribute('data-motion', settings.reducedMotion === 'system' ? 'system' : settings.reducedMotion);
  root.style.setProperty('--text-scale', String(settings.textScale));
  if (settings.accent === 'custom' && settings.accentCustom && /^#[0-9a-fA-F]{6}$/.test(settings.accentCustom)) {
    root.style.setProperty('--accent', settings.accentCustom);
    root.style.setProperty('--accent-fill', settings.accentCustom);
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${settings.accentCustom} 14%, transparent)`);
    root.style.setProperty('--on-accent-fill', luminance(settings.accentCustom) > 0.45 ? 'var(--bg)' : 'var(--text)');
  } else if (settings.accent !== 'mint') {
    root.style.setProperty('--accent', `var(--label-${settings.accent})`);
    root.style.setProperty('--accent-fill', `var(--label-${settings.accent})`);
    root.style.setProperty('--accent-soft', `color-mix(in srgb, var(--label-${settings.accent}) 14%, transparent)`);
    root.style.removeProperty('--on-accent-fill');
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-fill');
    root.style.removeProperty('--accent-soft');
    root.style.removeProperty('--on-accent-fill');
  }
  root.lang = locale;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', themeColors[theme].bg);
  try {
    localStorage.setItem(THEME_KEY, settings.theme);
  } catch {
    // storage may be unavailable (private mode); the inline script simply falls back to system
  }
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const useSettings = create<SettingsState>((set) => ({
  settings: defaultSettings,
  ready: false,
  resolvedTheme: resolveTheme('system'),
  locale: detectLocale('auto'),
  load: async () => {
    const settings = await loadSettings();
    const theme = resolveTheme(settings.theme);
    const locale = detectLocale(settings.locale);
    applyToDocument(settings, theme, locale);
    setLocale(locale);
    set({ settings, ready: true, resolvedTheme: theme, locale });
  },
  update: async (patch) => {
    const settings = await saveSettings(patch);
    const theme = resolveTheme(settings.theme);
    const locale = detectLocale(settings.locale);
    applyToDocument(settings, theme, locale);
    setLocale(locale);
    set({ settings, resolvedTheme: theme, locale });
  },
}));

// Follow the OS theme live while the setting is "system".
media?.addEventListener('change', () => {
  const { settings, locale } = useSettings.getState();
  if (settings.theme !== 'system') return;
  const theme = resolveTheme('system');
  applyToDocument(settings, theme, locale);
  useSettings.setState({ resolvedTheme: theme });
});

export const useSetting = <K extends keyof Settings>(key: K): Settings[K] => useSettings((s) => s.settings[key]);
