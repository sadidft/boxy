import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from '@/app/settings-store';
import { usePwa, storageEstimate } from '@/app/pwa';
import { downloadSnapshot, exportAll, exportBox, listSnapshots, snapshotNow } from '@/app/backup';
import { toast } from '@/app/ui-store';
import { getDB } from '@/data/db';
import { useBoxes, useCounts } from '@/hooks/data';
import { useFormat, modKey } from '@/hooks/format';
import { labelColors, labelHex } from '@/styles/tokens';
import type { Settings } from '@/data/types';
import { Icon } from '@/components/ui/Icon';
import { Button, Dialog, Field, Switch } from '@/components/ui/primitives';
import { PageHeader } from '@/components/shell/PageHeader';
import { ImportPanel } from '@/components/import/ImportPanel';
import { destroyAllData } from '@/app/reset';
import { ShortcutList } from '@/components/shell/ShortcutList';
import { SETTINGS_SECTIONS, type SettingsSection } from '@/pages/settings-sections';

export { SETTINGS_SECTIONS, type SettingsSection };


const sectionIcon: Record<SettingsSection, string> = { appearance: 'palette', storage: 'database', variables: 'braces', shortcuts: 'keyboard', 'import-export': 'arrow-left-right', privacy: 'shield', about: 'info' };
const sectionKey: Record<SettingsSection, string> = { appearance: 'settings.appearance', storage: 'settings.storage', variables: 'settings.variables', shortcuts: 'settings.shortcuts', 'import-export': 'settings.importExport', privacy: 'settings.privacy', about: 'settings.about' };

function Row({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="settings-row">
      <div className="min-w-0">
        <div className="font-semibold">{label}</div>
        {hint ? <div className="text-[0.85em] text-dim">{hint}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[0.8em] font-semibold tracking-wider text-dim uppercase">{title}</h2>
      <div className="divide-y divide-[var(--border)] rounded-card border border-line bg-surface px-3">{children}</div>
    </section>
  );
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string; icon?: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>
          {o.icon ? <Icon name={o.icon} size={13} /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsPage({ section }: { section: SettingsSection }) {
  const { t } = useTranslation();
  const valid = SETTINGS_SECTIONS.includes(section) ? section : 'appearance';
  return (
    <div className="flex h-full flex-col">
      <PageHeader icon="settings" title={t('settings.title')} subtitle={t(sectionKey[valid])} />
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-[200px] shrink-0 flex-col gap-0.5 border-r border-line p-2 md:flex" aria-label={t('settings.title')}>
          {SETTINGS_SECTIONS.map((s) => (
            <Link key={s} to="/settings/$section" params={{ section: s }} className={`flex items-center gap-2 rounded-control px-2.5 py-1.5 text-[0.95em] ${s === valid ? 'bg-accent-soft text-text' : 'text-muted hover:bg-surface2 hover:text-text'}`} aria-current={s === valid ? 'page' : undefined}>
              <Icon name={sectionIcon[s]} size={15} className={s === valid ? 'text-accent' : ''} />
              {t(sectionKey[s])}
            </Link>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex gap-1 overflow-x-auto border-b border-line px-2 py-1.5 md:hidden [scrollbar-width:none]">
            {SETTINGS_SECTIONS.map((s) => (
              <Link key={s} to="/settings/$section" params={{ section: s }} className="chip shrink-0" data-on={s === valid ? 'true' : undefined}>
                <Icon name={sectionIcon[s]} size={13} /> {t(sectionKey[s])}
              </Link>
            ))}
          </div>
          <div className="mx-auto max-w-2xl p-3 sm:p-5">
            {valid === 'appearance' ? <Appearance /> : valid === 'storage' ? <Storage /> : valid === 'variables' ? <Variables /> : valid === 'shortcuts' ? <Shortcuts /> : valid === 'import-export' ? <ImportExport /> : valid === 'privacy' ? <Privacy /> : <About />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Appearance() {
  const { t } = useTranslation();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => void update({ [k]: v } as Partial<Settings>);
  return (
    <>
      <Section title={t('settings.appearance')}>
        <Row label={t('settings.theme')}>
          <Seg
            label={t('settings.theme')}
            value={settings.theme}
            onChange={(v) => set('theme', v)}
            options={[
              { v: 'system', label: t('settings.themeSystem'), icon: 'monitor' },
              { v: 'dark', label: t('settings.themeDark'), icon: 'moon' },
              { v: 'light', label: t('settings.themeLight'), icon: 'sun' },
              { v: 'hc', label: t('settings.themeHc'), icon: 'contrast' },
            ]}
          />
        </Row>
        <Row label={t('settings.accent')} hint={t('settings.accentNote')}>
          <div className="flex flex-wrap items-center gap-1.5">
            {labelColors.map((c) => (
              <button key={c} type="button" className={`h-6 w-6 rounded-full border-2 ${settings.accent === c ? 'border-text' : 'border-transparent'}`} style={{ background: `var(--label-${c})` }} aria-label={t(`cards.labels.${c}`)} aria-pressed={settings.accent === c} onClick={() => set('accent', c)} />
            ))}
            <label className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 ${settings.accent === 'custom' ? 'border-text' : 'border-line-strong'}`} title={t('settings.accentCustom')}>
              <Icon name="pipette" size={12} />
              <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={settings.accentCustom ?? labelHex.mint} onChange={(e) => void update({ accent: 'custom', accentCustom: e.target.value })} aria-label={t('settings.accentCustom')} />
            </label>
          </div>
        </Row>
        <Row label={t('settings.density')}>
          <Seg label={t('settings.density')} value={settings.density} onChange={(v) => set('density', v)} options={[{ v: 'comfortable', label: t('settings.densityComfortable') }, { v: 'compact', label: t('settings.densityCompact') }]} />
        </Row>
        <Row label={t('settings.textScale')}>
          <Seg
            label={t('settings.textScale')}
            value={String(settings.textScale)}
            onChange={(v) => set('textScale', Number(v) as Settings['textScale'])}
            options={[
              { v: '0.9', label: t('settings.textSmall') },
              { v: '1', label: t('settings.textNormal') },
              { v: '1.1', label: t('settings.textLarge') },
              { v: '1.25', label: t('settings.textLarger') },
            ]}
          />
        </Row>
        <Row label={t('settings.readingFont')} hint={t('settings.readingFontHint')}>
          <Switch checked={settings.readingFont} onCheckedChange={(v) => set('readingFont', v)} label={t('settings.readingFont')} />
        </Row>
        <Row label={t('settings.reducedMotion')}>
          <Seg label={t('settings.reducedMotion')} value={settings.reducedMotion} onChange={(v) => set('reducedMotion', v)} options={[{ v: 'system', label: t('settings.motionSystem') }, { v: 'on', label: t('common.on') }, { v: 'off', label: t('common.off') }]} />
        </Row>
        <Row label={t('settings.language')}>
          <Seg label={t('settings.language')} value={settings.locale} onChange={(v) => set('locale', v)} options={[{ v: 'auto', label: t('settings.languageAuto') }, { v: 'en', label: t('settings.languageEn') }, { v: 'id', label: t('settings.languageId') }]} />
        </Row>
      </Section>
    </>
  );
}

function Storage() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const counts = useCounts();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const persisted = usePwa((s) => s.persisted);
  const requestPersist = usePwa((s) => s.requestPersist);
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const snapshots = useLiveQuery(() => listSnapshots(), []);
  const handoff = useLiveQuery(() => getDB().handoff.where('imported').equals(0).count(), []);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => {
    void storageEstimate().then(setEstimate);
  }, [counts]);
  const modes = [
    { key: 'local', name: t('storage.localName'), desc: t('storage.localDesc'), icon: 'hard-drive', active: true },
    { key: 'cloud', name: t('storage.cloudName'), desc: t('storage.cloudDesc'), icon: 'cloud', active: false },
    { key: 'self', name: t('storage.selfName'), desc: t('storage.selfDesc'), icon: 'server', active: false },
  ];
  return (
    <>
      <section className="mb-6">
        <h2 className="mb-2 text-[0.8em] font-semibold tracking-wider text-dim uppercase">{t('storage.modeTitle')}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {modes.map((m) => (
            <div key={m.key} className={`rounded-card border p-3 ${m.active ? 'border-accent/60 bg-accent-soft/30' : 'border-line bg-surface opacity-80'}`}>
              <div className="flex items-center gap-2">
                <Icon name={m.icon} size={16} className={m.active ? 'text-accent' : 'text-muted'} />
                <span className="font-semibold">{m.name}</span>
                {m.active ? <span className="ml-auto rounded-full bg-accent px-1.5 text-[0.7em] font-semibold text-on-accent-fill">{t('storage.active')}</span> : null}
              </div>
              <p className="mt-1 text-[0.85em] text-muted">{m.desc}</p>
              {!m.active ? <p className="mt-2 text-[0.8em] text-dim">{t('storage.later')}</p> : null}
            </div>
          ))}
        </div>
      </section>
      <Section title={t('storage.meterTitle')}>
        <Row label={estimate ? t('storage.meterUsage', { used: fmt.bytes(estimate.usage), quota: fmt.bytes(estimate.quota) }) : t('storage.meterUnknown')} hint={persisted ? t('storage.persisted') : t('storage.notPersisted')}>
          {persisted ? <Icon name="shield-check" size={18} className="text-accent" /> : <Button size="sm" onClick={() => void requestPersist()}>{t('settings.persistAsk')}</Button>}
        </Row>
        <Row label={`${counts?.boxes ?? 0} ${t('storage.countBoxes')} · ${counts?.cards ?? 0} ${t('storage.countCards')} · ${counts?.trash ?? 0} ${t('storage.countTrash')}`} hint={`${snapshots?.length ?? 0} ${t('storage.countBackups')}`}>
          <Link to="/trash" className="btn btn-sm">
            {t('storage.openTrash')}
          </Link>
        </Row>
      </Section>
      <Section title={t('storage.backupTitle')}>
        <Row label={t('storage.backupEnabled')} hint={t('storage.backupDesc', { count: 7 })}>
          <Switch checked={settings.autoBackup.enabled} onCheckedChange={(v) => void update({ autoBackup: { ...settings.autoBackup, enabled: v } })} label={t('storage.backupEnabled')} />
        </Row>
        <Row label={settings.autoBackup.lastAt ? t('storage.lastBackup', { when: fmt.relative(settings.autoBackup.lastAt) }) : t('storage.noBackup')}>
          <Button size="sm" icon="camera" onClick={() => void snapshotNow().then(() => toast(t('storage.snapshotSaved'), { kind: 'success' }))}>
            {t('storage.backupNow')}
          </Button>
        </Row>
        {snapshots?.map((s) => (
          <Row key={s.key} label={s.key.replace('snapshot.', '')} hint={fmt.bytes(s.bytes)}>
            <Button size="sm" variant="ghost" icon="download" onClick={() => void downloadSnapshot(s.key)}>
              {t('common.download')}
            </Button>
          </Row>
        ))}
      </Section>
      {handoff ? (
        <Section title={t('storage.legacyTitle')}>
          <Row label={t('storage.legacyReview')} hint={t('storage.legacyHandoffDesc')}>
            <Link to="/import/handoff" className="btn btn-sm btn-primary">
              {t('storage.legacyReview')}
            </Link>
          </Row>
        </Section>
      ) : null}
      <Section title={t('storage.resetTitle')}>
        <Row label={t('storage.resetButton')} hint={t('storage.resetDesc')}>
          <Button size="sm" variant="danger" icon="trash-2" onClick={() => setResetOpen(true)}>
            {t('storage.resetButton')}
          </Button>
        </Row>
      </Section>
      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}

function ResetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await exportAll().catch(() => undefined);
      await destroyAllData();
      toast(t('storage.resetDone'));
      onOpenChange(false);
      await navigate({ to: '/onboarding' });
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('storage.resetButton')}
      description={t('storage.resetDesc')}
      width="sm"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" disabled={text !== 'DELETE' || busy} onClick={() => void run()}>
            {t('storage.resetButton')}
          </Button>
        </>
      }
    >
      <Field label={t('storage.resetConfirm')}>
        <input className="input font-ui" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      </Field>
    </Dialog>
  );
}

function Variables() {
  const { t } = useTranslation();
  const globals = useLiveQuery(() => getDB().globals.orderBy('key').toArray(), []);
  const counters = useLiveQuery(() => getDB().counters.orderBy('name').toArray(), []);
  const [gKey, setGKey] = useState('');
  const [gVal, setGVal] = useState('');
  const [cName, setCName] = useState('');
  const ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
  return (
    <>
      <Section title={t('settings.globals')}>
        <div className="py-2 text-[0.85em] text-muted">{t('settings.globalsHint')}</div>
        {globals?.map((g) => (
          <Row key={g.key} label={<code className="text-accent">{`{{global:${g.key}}}`}</code>}>
            <input className="input w-[220px]" defaultValue={g.value} aria-label={t('settings.globalValue')} onBlur={(e) => void getDB().globals.put({ key: g.key, value: e.target.value, updatedAt: Date.now() })} />
            <Button size="sm" variant="ghost" icon="x" aria-label={`${t('common.remove')} ${g.key}`} onClick={() => void getDB().globals.delete(g.key)} />
          </Row>
        ))}
        <form
          className="flex flex-wrap items-end gap-2 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ident.test(gKey)) return;
            void getDB().globals.put({ key: gKey, value: gVal, updatedAt: Date.now() });
            setGKey('');
            setGVal('');
          }}
        >
          <Field label={t('settings.globalKey')}>
            <input className="input w-[160px] font-ui" value={gKey} onChange={(e) => setGKey(e.target.value)} placeholder="signature" pattern="[A-Za-z_][A-Za-z0-9_]*" />
          </Field>
          <Field label={t('settings.globalValue')}>
            <input className="input w-[220px]" value={gVal} onChange={(e) => setGVal(e.target.value)} />
          </Field>
          <Button type="submit" size="sm" icon="plus" disabled={!ident.test(gKey)}>
            {t('settings.addGlobal')}
          </Button>
        </form>
      </Section>
      <Section title={t('settings.counters')}>
        <div className="py-2 text-[0.85em] text-muted">{t('settings.countersHint')}</div>
        {counters?.map((c) => (
          <Row key={c.name} label={<code className="text-accent">{`{{counter:${c.name}}}`}</code>}>
            <label className="flex items-center gap-1 text-[0.85em] text-dim">
              {t('settings.counterValue')}
              <input className="input w-[90px] font-ui" type="number" defaultValue={c.value} onBlur={(e) => void getDB().counters.put({ ...c, value: Number(e.target.value) || 0, updatedAt: Date.now() })} />
            </label>
            <label className="flex items-center gap-1 text-[0.85em] text-dim">
              {t('settings.counterPad')}
              <input className="input w-[64px] font-ui" type="number" min={0} max={12} defaultValue={c.pad ?? 0} onBlur={(e) => void getDB().counters.put({ ...c, pad: Number(e.target.value) || undefined, updatedAt: Date.now() })} />
            </label>
            <Button size="sm" variant="ghost" icon="x" aria-label={`${t('common.remove')} ${c.name}`} onClick={() => void getDB().counters.delete(c.name)} />
          </Row>
        ))}
        <form
          className="flex flex-wrap items-end gap-2 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ident.test(cName)) return;
            void getDB().counters.put({ name: cName, value: 0, updatedAt: Date.now() });
            setCName('');
          }}
        >
          <Field label={t('settings.counterName')}>
            <input className="input w-[160px] font-ui" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="invoice" pattern="[A-Za-z_][A-Za-z0-9_]*" />
          </Field>
          <Button type="submit" size="sm" icon="plus" disabled={!ident.test(cName)}>
            {t('settings.addCounter')}
          </Button>
        </form>
      </Section>
    </>
  );
}

function Shortcuts() {
  const { t } = useTranslation();
  return (
    <section>
      <p className="mb-3 text-[0.9em] text-muted">{t('settings.shortcutsHint', { mod: modKey })}</p>
      <ShortcutList />
    </section>
  );
}

function ImportExport() {
  const { t } = useTranslation();
  const boxes = useBoxes(true);
  const counts = useCounts();
  const [boxId, setBoxId] = useState('');
  return (
    <>
      <Section title={t('import.exportTitle')}>
        <Row label={t('import.exportFull')} hint={t('import.exportFullDesc')}>
          <Button size="sm" icon="download" onClick={() => void (counts?.cards ? exportAll() : toast(t('import.nothingToExport')))}>
            {t('common.export')}
          </Button>
        </Row>
        <Row label={t('import.exportBox')} hint={t('import.exportBoxDesc')}>
          <select className="select" value={boxId} onChange={(e) => setBoxId(e.target.value)} aria-label={t('import.exportBoxChoose')}>
            <option value="">{t('import.exportBoxChoose')}</option>
            {boxes?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <Button size="sm" icon="download" disabled={!boxId} onClick={() => void exportBox(boxId, boxes?.find((b) => b.id === boxId)?.name ?? 'box')}>
            {t('common.export')}
          </Button>
        </Row>
      </Section>
      <section className="mb-6">
        <h2 className="mb-2 text-[0.8em] font-semibold tracking-wider text-dim uppercase">{t('import.title')}</h2>
        <ImportPanel />
      </section>
    </>
  );
}

function Privacy() {
  const { t } = useTranslation();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const persisted = usePwa((s) => s.persisted);
  const requestPersist = usePwa((s) => s.requestPersist);
  return (
    <>
      <Section title={t('settings.privacy')}>
        <Row label={t('settings.persist')} hint={persisted ? t('settings.persistOn') : t('settings.persistOff')}>
          {persisted ? <Icon name="shield-check" size={18} className="text-accent" /> : <Button size="sm" onClick={() => void requestPersist()}>{t('settings.persistAsk')}</Button>}
        </Row>
        <Row label={t('settings.clipboardClear')}>
          <Seg label={t('settings.clipboardClear')} value={String(settings.clipboardClearSeconds)} onChange={(v) => void update({ clipboardClearSeconds: Number(v) as Settings['clipboardClearSeconds'] })} options={[{ v: '0', label: t('settings.clipboardClearOff') }, { v: '30', label: t('settings.clipboardClear30') }, { v: '60', label: t('settings.clipboardClear60') }]} />
        </Row>
        <Row label={t('settings.telemetry')} hint={t('settings.telemetryNone')}>
          <Icon name="eye-off" size={18} className="text-accent" />
        </Row>
      </Section>
    </>
  );
}

function About() {
  const { t } = useTranslation();
  const update = useSettings((s) => s.update);
  const navigate = useNavigate();
  const installed = usePwa((s) => s.installed);
  const installEvent = usePwa((s) => s.installEvent);
  const install = usePwa((s) => s.install);
  const applyUpdate = usePwa((s) => s.applyUpdate);
  const [checking, setChecking] = useState(false);
  const checkUpdate = async () => {
    setChecking(true);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
      if (!usePwa.getState().updateReady) toast(t('settings.upToDate'));
    } finally {
      setChecking(false);
    }
  };
  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <img src="/logo.svg" alt="" width="48" height="64" />
        <div>
          <div className="font-display text-[1.6em] leading-tight">Boxy</div>
          <div className="text-muted">{t('common.tagline')}</div>
        </div>
      </div>
      <Section title={t('settings.about')}>
        <Row label={t('settings.build')}>
          <code className="text-[0.9em] text-accent">{__BUILD_ID__}</code>
        </Row>
        <Row label={t('settings.commit')}>
          <code className="text-[0.9em] text-muted">{__COMMIT__}</code>
        </Row>
        <Row label={t('settings.install')} hint={installed ? t('settings.installed') : installEvent ? t('settings.installHint') : t('settings.installUnavailable')}>
          {installed ? <Icon name="check" size={18} className="text-accent" /> : <Button size="sm" icon="download" disabled={!installEvent} onClick={() => void install()}>{t('settings.install')}</Button>}
        </Row>
        <Row label={t('settings.offlineReady')}>
          <Button size="sm" variant={applyUpdate ? 'primary' : 'default'} icon="refresh-cw" disabled={checking} onClick={() => (applyUpdate ? void applyUpdate() : void checkUpdate())}>
            {applyUpdate ? t('pwa.reload') : t('settings.checkUpdate')}
          </Button>
        </Row>
        <Row label={t('settings.repo')}>
          <a className="btn btn-sm" href="https://github.com/sadidft/boxy" target="_blank" rel="noopener noreferrer">
            <Icon name="github" size={14} /> GitHub
          </a>
        </Row>
        <Row label={t('settings.rerunOnboarding')}>
          <Button size="sm" onClick={() => void update({ onboardingDone: false }).then(() => navigate({ to: '/onboarding' }))}>
            {t('common.open')}
          </Button>
        </Row>
        <Row label={t('settings.madeBy')}>
          <a className="text-accent hover:underline" href="https://rafifsadid.my.id" target="_blank" rel="noopener noreferrer">
            rafifsadid.my.id
          </a>
        </Row>
      </Section>
    </>
  );
}
