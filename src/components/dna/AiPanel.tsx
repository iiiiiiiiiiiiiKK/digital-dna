import { useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../store/useApp';
import { AI_DISCLOSURE, callAi } from '../../lib/ai';
import { deleteInsight, getInsight, saveInsight } from '../../lib/db';
import type { AiInsight, DnaResult, Profile } from '../../lib/types';

const CONFIRM_KEY = 'digital-dna:ai-consent';

/**
 * Optional AI summary panel.
 *
 * Deliberately gated: it refuses to call anything until the user has
 * configured a key *and* acknowledged this session that their answers will be
 * sent to their chosen endpoint. With no key, the panel simply explains that
 * the feature is off and every other feature still works.
 */
export function AiPanel({ profile, result }: { profile: Profile; result: DnaResult }) {
  const settings = useApp((s) => s.settings);
  const [insight, setInsight] = useState<(AiInsight & { id: string; profileId: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const configured = settings.ai.enabled && settings.ai.apiKey.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    void getInsight(profile.id).then((row) => {
      if (!cancelled) setInsight(row ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const run = async () => {
    setError(null);
    if (!consent) {
      setError('Please confirm you understand what will be sent before running the request.');
      return;
    }
    setBusy(true);
    try {
      const out = await callAi(settings.ai, profile, result);
      const row: AiInsight & { id: string; profileId: string } = {
        id: `${profile.id}:ai:${Date.now()}`,
        profileId: profile.id,
        text: out.summary,
        suggestedTags: out.tags,
        createdAt: new Date().toISOString(),
        model: settings.ai.model,
      };
      await saveInsight(row);
      setInsight(row);
      sessionStorage.setItem(CONFIRM_KEY, '1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI request failed.');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    await deleteInsight(profile.id);
    setInsight(null);
  };

  return (
    <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="kicker mb-1.5">Optional module</p>
          <p className="text-[14px] font-semibold text-white/85">AI summary &amp; tag ideas</p>
        </div>
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-neon-violet/70" />
      </div>

      {!configured ? (
        <div className="space-y-3">
          <p className="text-[12px] leading-relaxed text-white/45">
            AI is off. Every core feature — generation, artwork, export, share, compare, history — works without it.
          </p>
          <Link to="/settings" className="btn-ghost !justify-start !py-2.5 text-[12.5px]">
            <KeyRound className="h-3.5 w-3.5" />
            Configure in Settings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3.5 py-3">
            <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-amber-100/70">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {AI_DISCLOSURE}
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 accent-neon-cyan"
            />
            <span className="text-[11.5px] leading-relaxed text-white/50">
              I understand the answers listed on this page will be sent to{' '}
              <span className="font-mono text-white/70">{settings.ai.baseUrl || 'my endpoint'}</span> using my own key.
            </span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy || !consent}
              className="btn-primary flex-1 !py-2.5 text-[12.5px] disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {insight ? 'Regenerate' : 'Generate summary'}
            </button>
            {insight && (
              <button type="button" onClick={() => void clear()} className="btn-ghost !px-3" aria-label="Delete AI note">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/25 bg-red-400/[0.07] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-red-200/85">
              {error}
            </p>
          )}

          {insight && (
            <div className="rounded-xl border border-neon-violet/25 bg-neon-violet/[0.07] px-3.5 py-3">
              <p className="text-[12px] leading-relaxed text-white/70">{insight.text}</p>
              {insight.suggestedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {insight.suggestedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-neon-violet/35 bg-neon-violet/10 px-2 py-0.5 text-[10.5px] text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] text-white/25">
                {insight.model} · {new Date(insight.createdAt).toLocaleString()} · model output, not an assessment
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
