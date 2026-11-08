import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Database, Download, KeyRound, Trash2, Upload, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../store/useApp';
import { deleteProfileCascade, exportBundle, importBundle } from '../lib/db';
import { Callout, SectionTitle } from '../components/ui/Primitives';
import { downloadBlob } from '../lib/export';

export default function SettingsPage() {
  const navigate = useNavigate();
  const profile = useApp((s) => s.profile);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const setVisibility = useApp((s) => s.setVisibility);
  const init = useApp((s) => s.init);

  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!status) return;
    const id = window.setTimeout(() => setStatus(null), 6000);
    return () => window.clearTimeout(id);
  }, [status]);

  const exportJson = async () => {
    try {
      const bundle = await exportBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `digital-dna-backup-${new Date().toISOString().slice(0, 10)}.json`);
      setStatus({ tone: 'ok', text: `Exported ${bundle.profiles.length} profile(s) and ${bundle.versions.length} version(s).` });
    } catch (err) {
      setStatus({ tone: 'err', text: err instanceof Error ? err.message : 'Export failed.' });
    }
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await importBundle(parsed);
      await init();
      setStatus({
        tone: 'ok',
        text: `Imported ${result.profiles} profile(s) and ${result.versions} version(s).${result.skipped ? ` Skipped ${result.skipped} invalid entr${result.skipped === 1 ? 'y' : 'ies'}.` : ''}`,
      });
    } catch (err) {
      setStatus({ tone: 'err', text: err instanceof Error ? err.message : 'Import failed.' });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteEverything = async () => {
    try {
      await deleteProfileCascade(profile.id);
      setConfirmDelete(false);
      await init();
      navigate('/');
      setStatus({ tone: 'ok', text: 'All local data deleted.' });
    } catch (err) {
      setStatus({ tone: 'err', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  };

  return (
    <div className="shell max-w-3xl py-6 sm:py-10">
      <div className="mb-6">
        <p className="kicker mb-1.5">Settings</p>
        <h1 className="h2 text-white/95">Data &amp; privacy</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/45">
          Everything this app knows about you lives in this browser&apos;s IndexedDB. There is no account system and no
          server that could hold a copy.
        </p>
      </div>

      {status && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-[12.5px] ${
            status.tone === 'ok'
              ? 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-100/80'
              : 'border-red-400/25 bg-red-400/[0.07] text-red-200/85'
          }`}
        >
          {status.text}
        </div>
      )}

      {/* ------------------------------------------------------------ Privacy */}
      <section className="panel mb-4 p-5">
        <SectionTitle kicker="Visibility" title="Default share state" />
        <div className="grid grid-cols-2 gap-2">
          {(['private', 'public'] as const).map((v) => {
            const active = profile.visibility === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => void setVisibility(v)}
                aria-pressed={active}
                className={`min-h-[52px] rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  active ? 'border-neon-cyan/55 bg-neon-cyan/[0.1]' : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <span className={`block text-[13px] font-semibold ${active ? 'text-white' : 'text-white/65'}`}>
                  {v === 'private' ? 'Private' : 'Public'}
                </span>
                <span className="mt-0.5 block text-[11px] text-white/30">
                  {v === 'private' ? 'No share link is ever produced' : 'A share link can be copied'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------- Backup */}
      <section className="panel mb-4 p-5">
        <SectionTitle kicker="Local backup" title="Export or restore everything" />
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => void exportJson()} className="btn-ghost !justify-start !py-3 text-[12.5px]">
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost !justify-start !py-3 text-[12.5px]">
            <Upload className="h-4 w-4" />
            Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void importJson(e.target.files?.[0])}
        />
        <p className="mt-3 text-[11.5px] leading-relaxed text-white/30">
          The export contains your profiles, answers, generated results and version history. It is a plain JSON file —
          keep it somewhere safe, since it is the only backup.
        </p>
      </section>

      {/* ---------------------------------------------------------------- AI */}
      <section className="panel mb-4 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SectionTitle kicker="Optional" title="AI provider" />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={settings.ai.enabled}
              onChange={(e) =>
                void updateSettings({ ...settings, ai: { ...settings.ai, enabled: e.target.checked } })
              }
              className="h-4 w-4 rounded border-white/20 bg-black/40 accent-neon-cyan"
            />
            <span className="text-[11.5px] text-white/50">{settings.ai.enabled ? 'On' : 'Off'}</span>
          </label>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="ai-base">
              API base URL
            </label>
            <input
              id="ai-base"
              value={settings.ai.baseUrl}
              onChange={(e) => void updateSettings({ ...settings, ai: { ...settings.ai, baseUrl: e.target.value } })}
              placeholder="https://api.openai.com/v1"
              className="field !py-2.5 font-mono text-[12px]"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="label" htmlFor="ai-model">
              Model name
            </label>
            <input
              id="ai-model"
              value={settings.ai.model}
              onChange={(e) => void updateSettings({ ...settings, ai: { ...settings.ai, model: e.target.value } })}
              placeholder="gpt-4o-mini"
              className="field !py-2.5 font-mono text-[12px]"
              spellCheck={false}
            />
          </div>

          <div>
            <label className="label" htmlFor="ai-key">
              API key
            </label>
            <div className="flex gap-2">
              <input
                id="ai-key"
                type={showKey ? 'text' : 'password'}
                value={settings.ai.apiKey}
                onChange={(e) => void updateSettings({ ...settings, ai: { ...settings.ai, apiKey: e.target.value } })}
                placeholder="sk-…"
                className="field !py-2.5 font-mono text-[12px]"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="btn-ghost shrink-0 !px-3"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3.5 py-3">
            <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-amber-100/70">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Your key is stored only in this browser and is sent only to the endpoint above, only when you press a
              generate button. Because there is no backend, any key you enter is exposed to anything that can run
              JavaScript on this origin — only use a key you are willing to rotate.
            </p>
          </div>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-white/28">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
            Core features never call the network. No paid model is used unless you configure and trigger one yourself.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- Delete */}
      <section className="panel border-red-400/15 p-5">
        <SectionTitle kicker="Destructive" title="Delete all local data" />
        <p className="mb-3 text-[12px] leading-relaxed text-white/40">
          Permanently removes your profile, every generated version, AI notes and any saved draft from this browser.
          This cannot be undone — export a backup first if you want to keep anything.
        </p>

        {confirmDelete ? (
          <div className="space-y-2">
            <Callout tone="warn">
              This is irreversible. There is no server copy to restore from.
            </Callout>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void deleteEverything()}
                className="btn flex-1 !py-2.5 border border-red-400/40 bg-red-400/[0.12] text-[12.5px] font-semibold text-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Yes, delete everything
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost shrink-0 !py-2.5 text-[12.5px]">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn !py-2.5 border border-red-400/25 bg-red-400/[0.06] text-[12.5px] font-semibold text-red-200/85"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my data
          </button>
        )}
      </section>

      {/* -------------------------------------------------------- About storage */}
      <section className="mt-5 flex items-start gap-2.5 px-1">
        <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" />
        <p className="text-[11px] leading-relaxed text-white/25">
          Storage: IndexedDB database <span className="font-mono text-white/40">digital-dna</span> (tables: profiles,
          versions, insights, settings, drafts). Clearing site data in your browser has the same effect as the delete
          button above.
        </p>
      </section>

      <div className="mt-5 flex items-center gap-2">
        <KeyRound className="h-3.5 w-3.5 text-white/20" />
        <p className="text-[11px] text-white/25">
          No environment variables are required to run this app. See <span className="font-mono">.env.example</span> in
          the repository for the optional ones.
        </p>
      </div>
    </div>
  );
}
