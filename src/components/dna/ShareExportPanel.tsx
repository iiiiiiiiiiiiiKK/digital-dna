import { useMemo, useState } from 'react';
import { Check, Copy, Download, Image as ImageIcon, Link2, Loader2, Lock, Share2 } from 'lucide-react';
import { useApp } from '../../store/useApp';
import type { DnaResult, Profile } from '../../lib/types';
import { downloadBlob, exportFilename, renderCardPng } from '../../lib/export';
import { buildShareUrl } from '../../lib/share';

interface Props {
  profile: Profile;
  result: DnaResult;
}

export function ShareExportPanel({ profile, result }: Props) {
  const setVisibility = useApp((s) => s.setVisibility);
  const [busy, setBusy] = useState<'square' | 'poster' | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublic = profile.visibility === 'public';
  // The link is always rendered as a readable field, so copying works even on
  // browsers that block the async clipboard API (notably iOS Safari outside
  // user-gesture contexts).
  const shareUrl = useMemo(() => (isPublic ? buildShareUrl(profile, result) : ''), [isPublic, profile, result]);

  const exportPng = async (format: 'square' | 'poster') => {
    setBusy(format);
    setError(null);
    try {
      const blob = await renderCardPng({ profile, result, format, scale: 2 });
      downloadBlob(blob, exportFilename(profile, result, format));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    setError(null);
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for browsers/clipboard permissions that reject the async API.
        const el = document.createElement('textarea');
        el.value = shareUrl;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        el.remove();
      }
    } catch {
      // Copy can fail silently on older iOS; the field below still lets the
      // user select and copy manually, so this is not a dead end.
      setError('Automatic copy was blocked. Select the link below and copy it manually.');
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="kicker mb-2">Share &amp; export</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void exportPng('square')}
            disabled={busy !== null}
            className="btn-ghost !justify-start !py-2.5 text-[12.5px]"
          >
            {busy === 'square' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Square card
          </button>
          <button
            type="button"
            onClick={() => void exportPng('poster')}
            disabled={busy !== null}
            className="btn-ghost !justify-start !py-2.5 text-[12.5px]"
          >
            {busy === 'poster' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Story poster
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/28">PNG · square 2160×2160 · poster 2160×3840 (2× for retina)</p>
      </div>

      <div className="hairline" />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="label !mb-0">Who can open this?</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isPublic
                ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200/90'
                : 'border-white/15 bg-white/[0.04] text-white/50'
            }`}
          >
            {isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void setVisibility('private')}
            aria-pressed={!isPublic}
            className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border text-[12.5px] font-semibold transition-all ${
              !isPublic ? 'border-white/30 bg-white/[0.08] text-white' : 'border-white/10 text-white/45'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            Private
          </button>
          <button
            type="button"
            onClick={() => void setVisibility('public')}
            aria-pressed={isPublic}
            className={`flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl border text-[12.5px] font-semibold transition-all ${
              isPublic ? 'border-emerald-400/45 bg-emerald-400/[0.1] text-white' : 'border-white/10 text-white/45'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Public
          </button>
        </div>

        <div className="mt-3">
          {isPublic ? (
            <div className="space-y-2">
              <button type="button" onClick={() => void copyLink()} className="btn-primary w-full !py-2.5 text-[13px]">
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {copied ? 'Link copied' : 'Copy public link'}
              </button>
              <input
                type="text"
                readOnly
                value={shareUrl}
                aria-label="Public share link"
                onFocus={(e) => e.currentTarget.select()}
                className="field !py-2 font-mono text-[10.5px] text-white/45"
              />
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-white/40">
              Private means no share link is produced at all — the payload is never encoded, so nobody can reopen this
              page from a URL.
            </p>
          )}
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-white/25">
          A public link carries a small snapshot of these answers inside the URL fragment. It is not stored on any
          server, and it stays readable by anyone who has the link. Only what the card needs is included: no id, no
          avatar, no local metadata.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-400/[0.07] px-3.5 py-2.5 text-[11.5px] text-red-200/85">
          {error}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-white/22">
        <Copy className="h-3 w-3" />
        Exports include only the card artwork — never your raw answer list.
      </p>
    </div>
  );
}
