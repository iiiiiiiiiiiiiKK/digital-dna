import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Edit3, Sparkles } from 'lucide-react';
import { useApp } from '../store/useApp';
import { DnaHelix } from '../components/dna/DnaHelix';
import { RadarChart } from '../components/dna/RadarChart';
import { RingChart } from '../components/dna/RingChart';
import { GeneBars } from '../components/dna/GeneBars';
import { TagCloud } from '../components/dna/TagCloud';
import { AssociationGraph } from '../components/dna/AssociationGraph';
import { ShareExportPanel } from '../components/dna/ShareExportPanel';
import { EngineExplainer } from '../components/engine/EngineExplainer';
import { SectionTitle, EmptyState, Callout } from '../components/ui/Primitives';
import { AiPanel } from '../components/dna/AiPanel';
import { decodeSharePayload } from '../lib/share';
import { generateDna } from '../lib/engine';
import type { DnaResult, Profile } from '../lib/types';

/**
 * Result page. Doubles as the public share view: if a share token is present in
 * the route it renders that immutable snapshot instead of local storage, marked
 * as read-only.
 */
export default function DnaResultPage() {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const profile = useApp((s) => s.profile);
  const result = useApp((s) => s.result);
  const versions = useApp((s) => s.versions);
  const setVisibility = useApp((s) => s.setVisibility);

  const shared = useMemo(() => (token ? decodeSharePayload(token) : null), [token]);

  // Local visitors with no generated DNA yet get a friendly redirect.
  useEffect(() => {
    if (!token && !result) return;
  }, [token, result]);

  if (token) {
    if (!shared) {
      return (
        <div className="shell py-16">
          <EmptyState
            title="This share link is malformed"
            hint="The payload in the URL could not be decoded. Ask the sender for a fresh link."
          />
        </div>
      );
    }
    return (
      <DnaView
        profile={shared.profile}
        result={shared.result}
        readOnly
        onEdit={() => navigate('/')}
        onVisibilityChange={undefined}
      />
    );
  }

  if (!result) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="No DNA generated yet"
          hint="Complete the seven-step wizard and your helix will appear here."
        />
        <div className="mt-5 flex justify-center">
          <Link to="/create" className="btn-primary">
            Create My DNA
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DnaView
      profile={profile}
      result={result}
      readOnly={false}
      version={versions.length}
      onEdit={() => navigate('/create')}
      onVisibilityChange={(v) => void setVisibility(v)}
    />
  );
}

interface ViewProps {
  profile: Profile;
  result: DnaResult;
  readOnly: boolean;
  version?: number;
  onEdit: () => void;
  onVisibilityChange?: (v: 'private' | 'public') => void;
}

export function DnaView({ profile, result, readOnly, version, onEdit }: ViewProps) {
  const p = result.palette;
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="pb-8">
      {/* ---------------------------------------------------------- Masthead */}
      <section className="shell pt-6 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-2.5 py-1 font-mono text-[11px] tracking-[0.14em]"
                style={{ borderColor: `${p.accent}55`, color: p.accent, background: `${p.accent}12` }}
              >
                {result.dnaCode}
              </span>
              {readOnly ? (
                <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-white/50">
                  Shared view
                </span>
              ) : (
                <span className="text-[11px] text-white/28">
                  v{version} · {new Date(result.generatedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="truncate text-[clamp(1.75rem,6vw,3rem)] font-semibold tracking-tight text-white">
              {profile.nickname || 'Unnamed'}
            </h1>
            <p className="mt-1 text-[13px] text-white/40">
              {[profile.role, profile.field].filter(Boolean).join(' · ') || result.archetype.title}
            </p>
            {profile.bio && <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-white/50">{profile.bio}</p>}
          </div>

          {!readOnly && (
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={onEdit} className="btn-ghost !py-2.5 text-[12.5px]">
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- Helix */}
      <section className="shell mt-6 sm:mt-8">
        <div className="overflow-hidden rounded-xl3 border border-white/[0.08]" style={{ background: p.background }}>
          <DnaHelix result={result} uid="result" className="block h-auto w-full" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="kicker mb-1.5">Archetype label</p>
            <p className="text-[17px] font-semibold text-white/90">{result.archetype.title}</p>
            <p className="mt-0.5 text-[11.5px] text-white/35">{result.archetype.subtitle}</p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/45">{result.archetype.description}</p>
          </div>

          <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="kicker mb-2">Identity tags</p>
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
                  style={{ borderColor: `${p.accent}44`, color: p.accent, background: `${p.accent}0d` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Analysis */}
      <section className="shell mt-10 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Interest genes" title="What pulls your attention">
            {result.interestGenes.length} domains
          </SectionTitle>
          <GeneBars genes={result.interestGenes} palette={p} />
        </div>

        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Skill genes" title="What you say you can do">
            {result.skillGenes.length} skills
          </SectionTitle>
          <GeneBars genes={result.skillGenes} palette={p} />
        </div>
      </section>

      <section className="shell mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Dimension map" title="Eight derived dimensions" />
          <RadarChart
            dimensions={result.dimensions}
            accent={p.accent}
            accentSoft={p.accentSoft}
            textMuted={p.textMuted}
            className="mx-auto block h-auto w-full max-w-[440px]"
          />
        </div>

        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Gene ring" title="Relative weight" />
          <RingChart genes={[...result.interestGenes]} palette={p} className="mx-auto block h-auto w-full max-w-[340px]" />
          <p className="mt-2 text-center text-[11px] text-white/25">Arc sweep is proportional to each gene&apos;s share.</p>
        </div>
      </section>

      <section className="shell mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Association graph" title="How interests and skills connect" />
          <AssociationGraph result={result} className="block h-auto w-full" />
        </div>

        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Tag cloud" title="Your identity vocabulary" />
          <TagCloud cloud={result.tagCloud} palette={p} />
        </div>
      </section>

      {/* --------------------------------------------------- Creative & habits */}
      <section className="shell mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Creative genes" title="How you like to work" />
          <dl className="space-y-3">
            {result.creativeSummary.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] pb-2.5 last:border-0 last:pb-0">
                <dt className="text-[11px] uppercase tracking-[0.12em] text-white/28">{row.label}</dt>
                <dd className="text-right text-[12.5px] font-medium text-white/75">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker="Digital habits" title="Your digital day" />
          {result.habitSummary.length === 0 ? (
            <p className="text-[12.5px] text-white/35">No habits listed.</p>
          ) : (
            <dl className="space-y-3">
              {result.habitSummary.map((row) => (
                <div key={row.label}>
                  <dt className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-white/28">{row.label}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {row.values.slice(0, 8).map((v) => (
                      <span key={v} className="chip !py-1 text-[11px]">
                        {v}
                      </span>
                    ))}
                    {row.values.length > 8 && (
                      <span className="text-[11px] text-white/25">+{row.values.length - 8}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ Summary + actions */}
      <section className="shell mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            <SectionTitle kicker="Profile summary" title="What your DNA says" />
            <p className="text-[13px] leading-relaxed text-white/55">{result.summary}</p>
          </div>

          <EngineExplainer />

          <Callout>
            Digital DNA restates the options you chose. It is not a personality test, not a psychological assessment, and
            not a measure of intelligence or ability. Skill levels are your own self-ratings.
          </Callout>

          {aiOpen ? (
            <AiPanel profile={profile} result={result} />
          ) : (
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-xl2 border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-left transition-colors hover:border-white/20"
            >
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-white/70">Optional AI summary</span>
                <span className="mt-0.5 block text-[11px] text-white/30">
                  Works only if you add your own API key in Settings. Never required.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
            {readOnly ? (
              <>
                <p className="kicker mb-2">Shared DNA</p>
                <p className="text-[12.5px] leading-relaxed text-white/45">
                  You are viewing a link someone shared. Nothing here is stored on this device, and no data was
                  requested from a server — the whole page was rebuilt from the URL fragment.
                </p>
                <Link to="/create" className="btn-primary mt-4 w-full !py-2.5 text-[13px]">
                  Create my own DNA
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <ShareExportPanel profile={profile} result={result} />
            )}
          </div>

          {!readOnly && (
            <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
              <p className="kicker mb-2">Continue</p>
              <div className="space-y-2">
                <Link to="/evolution" className="btn-ghost w-full !justify-start !py-2.5 text-[12.5px]">
                  View DNA evolution
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Link>
                <Link to="/compare" className="btn-ghost w-full !justify-start !py-2.5 text-[12.5px]">
                  Compare with another DNA
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Lightweight wrapper so /dna/:token can be routed directly. */
export function useSharedResult(token: string | undefined) {
  return useMemo(() => {
    if (!token) return null;
    const decoded = decodeSharePayload(token);
    if (!decoded) return null;
    return { profile: decoded.profile, result: generateDna(decoded.profile, 1, decoded.result.generatedAt) };
  }, [token]);
}
