import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { useSettings } from '@/app/settings-store';
import { usePwa } from '@/app/pwa';
import { packs, type PackId } from '@/content/packs';
import { installEmpty, installPacks } from '@/content/packs/install';
import { Icon } from '@/components/ui/Icon';
import { Button, Kbd } from '@/components/ui/primitives';
import { ImportPanel } from '@/components/import/ImportPanel';
import { modKey, altKey } from '@/hooks/format';
import type { MigrationLog } from '@/data/types';

type Source = 'import' | 'pack' | 'empty';

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const settings = useSettings((s) => s.settings);
  const locale = useSettings((s) => s.locale);
  const update = useSettings((s) => s.update);
  const installEvent = usePwa((s) => s.installEvent);
  const install = usePwa((s) => s.install);
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>('pack');
  const [selected, setSelected] = useState<PackId[]>(['email', 'shell']);
  const [busy, setBusy] = useState(false);
  const [importedLog, setImportedLog] = useState<MigrationLog | null>(null);
  const [firstBox, setFirstBox] = useState<string | null>(null);

  const finish = async () => {
    await update({ onboardingDone: true, ...(firstBox ? { lastBoxId: firstBox } : {}) });
    if (firstBox) await navigate({ to: '/b/$boxId', params: { boxId: firstBox } });
    else await navigate({ to: '/' });
  };

  const applySource = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (source === 'pack' && selected.length) {
        const ids = await installPacks(selected, locale);
        setFirstBox(ids[0] ?? null);
      } else if (source === 'empty') {
        const id = await installEmpty({ box: t('onboarding.emptyBoxName'), tab: t('onboarding.emptyTabName') });
        setFirstBox(id);
      }
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const steps = [t('onboarding.stepLanguage'), t('onboarding.stepData'), t('onboarding.stepTour')];

  return (
    <div className="grain flex min-h-dvh flex-col items-center overflow-y-auto bg-bg px-4 py-8 safe-top safe-bottom">
      <div className="w-full max-w-2xl fade-in">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo.svg" alt="" width="40" height="52" />
          <div>
            <h1 className="font-display text-[1.8em] leading-tight">{t('onboarding.welcome')}</h1>
            <p className="text-muted">{t('common.tagline')}</p>
          </div>
        </div>
        <ol className="mb-5 flex items-center gap-2 text-[0.85em]" aria-label={t('onboarding.welcome')}>
          {steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 ${i === step ? 'text-text' : 'text-dim'}`} aria-current={i === step ? 'step' : undefined}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.8em] font-semibold ${i < step ? 'bg-accent text-on-accent-fill' : i === step ? 'border border-accent text-accent' : 'border border-line-strong'}`}>{i < step ? <Icon name="check" size={11} /> : i + 1}</span>
              {s}
              {i < steps.length - 1 ? <span className="mx-1 h-px w-6 bg-line-strong" /> : null}
            </li>
          ))}
        </ol>

        <div className="panel p-4 sm:p-5">
          {step === 0 ? (
            <div className="space-y-4">
              <h2 className="text-[1.1em] font-semibold">{t('onboarding.chooseLanguage')}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['en', 'id'] as const).map((l) => (
                  <button key={l} type="button" className={`flex items-center gap-3 rounded-card border p-3 text-left ${settings.locale === l || (settings.locale === 'auto' && locale === l) ? 'border-accent bg-accent-soft/40' : 'border-line hover:border-line-strong'}`} onClick={() => void update({ locale: l })} aria-pressed={settings.locale === l}>
                    <Icon name="languages" size={18} className="text-accent" />
                    <span className="font-semibold">{l === 'en' ? t('settings.languageEn') : t('settings.languageId')}</span>
                  </button>
                ))}
              </div>
              <p className="text-[0.85em] text-dim">{t('onboarding.privacyLine')}</p>
              <div className="flex justify-end">
                <Button variant="primary" iconRight="arrow-right" onClick={() => setStep(1)}>
                  {t('common.next')}
                </Button>
              </div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-[1.1em] font-semibold">{t('onboarding.stepData')}</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { id: 'import', icon: 'arrow-down-to-line', name: t('onboarding.sourceImport'), desc: t('onboarding.sourceImportDesc') },
                    { id: 'pack', icon: 'package', name: t('onboarding.sourcePack'), desc: t('onboarding.sourcePackDesc') },
                    { id: 'empty', icon: 'square-dashed', name: t('onboarding.sourceEmpty'), desc: t('onboarding.sourceEmptyDesc') },
                  ] as const
                ).map((s) => (
                  <button key={s.id} type="button" className={`rounded-card border p-3 text-left ${source === s.id ? 'border-accent bg-accent-soft/40' : 'border-line hover:border-line-strong'}`} onClick={() => setSource(s.id)} aria-pressed={source === s.id}>
                    <Icon name={s.icon} size={18} className="mb-1 text-accent" />
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-[0.85em] text-muted">{s.desc}</div>
                  </button>
                ))}
              </div>
              {source === 'pack' ? (
                <div>
                  <div className="mb-1.5 text-[0.8em] font-semibold tracking-wider text-dim uppercase">{t('onboarding.packs')}</div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {packs.map((p) => {
                      const on = selected.includes(p.id);
                      return (
                        <label key={p.id} className={`flex cursor-pointer items-start gap-2.5 rounded-control border p-2.5 ${on ? 'border-accent/60 bg-accent-soft/30' : 'border-line'}`}>
                          <input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={on} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} />
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-[var(--bg)]" style={{ background: `var(--label-${p.color})` }}>
                            <Icon name={p.icon} size={15} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">{t(`onboarding.pack${p.id[0]!.toUpperCase()}${p.id.slice(1)}`)}</span>
                            <span className="block text-[0.85em] text-muted">{t(`onboarding.pack${p.id[0]!.toUpperCase()}${p.id.slice(1)}Desc`)}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : source === 'import' ? (
                <ImportPanel
                  compact
                  onDone={(log) => {
                    setImportedLog(log);
                  }}
                />
              ) : null}
              <div className="flex items-center justify-between">
                <Button variant="ghost" icon="arrow-left" onClick={() => setStep(0)}>
                  {t('common.back')}
                </Button>
                {source === 'import' ? (
                  <Button variant="primary" iconRight="arrow-right" disabled={!importedLog} onClick={() => setStep(2)}>
                    {t('common.next')}
                  </Button>
                ) : (
                  <Button variant="primary" iconRight="arrow-right" disabled={busy || (source === 'pack' && !selected.length)} onClick={() => void applySource()}>
                    {busy ? t('common.loading') : t('common.next')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-[1.1em] font-semibold">{t('onboarding.stepTour')}</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
                    <Icon name="command" size={16} />
                  </span>
                  <p className="text-[0.95em] text-muted">
                    {t('onboarding.tourPalette', { shortcut: '' })} <Kbd>{modKey}</Kbd> <Kbd>K</Kbd>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
                    <Icon name="zap" size={16} />
                  </span>
                  <p className="text-[0.95em] text-muted">
                    {t('onboarding.tourQuick', { shortcut: '' })} <Kbd>{altKey}</Kbd> <Kbd>1..9</Kbd>
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
                    <Icon name="braces" size={16} />
                  </span>
                  <p className="text-[0.95em] text-muted">{t('onboarding.tourVars', { example: '{{name}}' })}</p>
                </li>
              </ul>
              <p className="text-[0.85em] text-dim">{t('onboarding.localFirst')}</p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {installEvent ? (
                  <Button icon="download" onClick={() => void install()}>
                    {t('settings.install')}
                  </Button>
                ) : (
                  <span />
                )}
                <Button variant="primary" iconRight="arrow-right" onClick={() => void finish()}>
                  {t('onboarding.start')}
                </Button>
              </div>
            </div>
          )}
        </div>
        {step < 2 ? (
          <div className="mt-3 text-center">
            <button type="button" className="text-[0.85em] text-dim hover:text-text" onClick={() => void update({ onboardingDone: true }).then(() => navigate({ to: '/' }))}>
              {t('common.skip')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
