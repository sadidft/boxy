/** Sections of the Settings page; kept in a tiny module so the router does not need to load the page itself. */
export const SETTINGS_SECTIONS = ['appearance', 'storage', 'variables', 'shortcuts', 'import-export', 'privacy', 'about'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
