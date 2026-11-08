import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GitCompare, Info } from 'lucide-react';
import { useApp } from '../store/useApp';
import { DEMO_RESULTS } from '../lib/demo';
import { compareProfiles } from '../lib/similarity';
import { DnaHelix } from '../components/dna/DnaHelix';
import { SectionTitle, EmptyState, Callout } from '../components/ui/Primitives';
import type { DnaResult, Profile } from '../lib/types';

interface Candidate {
  key: string;
  label: string;
  profile: Profile;
  result: DnaResult;
  demo: boolean;
}

export default function Compare() {
  const profile = useApp((s) => s.profile);
  const myResult = useApp((s) => s.result);

  const candidates = useMemo<Candidate[]>(() => {
    const list: Candidate[] = [];
    if (myResult) {
      list.push({ key: 'me', label: `${profile.nickname || 'You'} (mine)`, profile, result: myResult, demo: false });
    }
    for (const demo of DEMO_RESULTS) {
      list.push({
        key: demo.profile.id,
        label: `${demo.profile.nickname} (Demo)`,
        profile: demo.profile,
        result: demo.result,
        demo: true,
      });
    }
    return list;
  }, [profile, myResult]);

  const [leftKey, setLeftKey] = useState<string>(myResult ? 'me' : DEMO_RESULTS[0].profile.id);
  const [rightKey, setRightKey] = useState<string>(myResult ? DEMO_RESULTS[0].profile.id : DEMO_RESULTS[1].profile.id);

  const left = candidates.find((c) => c.key === leftKey) ?? candidates[0];
  const right = candidates.find((c) => c.key === rightKey) ?? candidates[1] ?? candidates[0];

  const report = useMemo(() => {
    if (!left || !right) return null;
    if (left.key === right.key) return null;
    return compareProfiles({ profile: left.profile, result: left.result }, { profile: right.profile, result: right.result });
  }, [left, right]);

  if (candidates.length < 2) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={<GitCompare className="h-5 w-5" />}
          title="Generate a DNA first"
          hint="Comparison needs your own helix plus at least one other profile. The two demo profiles are always available once yours exists."
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
    <div className="shell py-6 sm:py-10">
      <div className="mb-6">
        <p className="kicker mb-1.5">Compare DNA</p>
        <h1 className="h2 text-white/95">Two helixes, side by side</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/45">
          These numbers describe how much your <em>answers</em> overlap. They are not a compatibility score, a
          personality match, or any kind of prediction about two people.
        </p>
      </div>

      {/* Pickers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Picker label="Left" value={leftKey} onChange={setLeftKey} options={candidates} />
        <Picker label="Right" value={rightKey} onChange={setRightKey} options={candidates} />
      </div>

      {!report ? (
        <div className="mt-6">
          <Callout tone="warn">Pick two different profiles to compare.</Callout>
        </div>
      ) : (
        <>
          {/* Helix pair */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[left, right].map((side) => (
              <div key={side.key} className="overflow-hidden rounded-xl2 border border-white/[0.08] bg-white/[0.02]">
                <DnaHelix result={side.result} uid={`cmp-${side.key}`} className="block h-auto w-full" compact />
                <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-semibold text-white/80">{side.profile.nickname}</span>
                    {side.demo && (
                      <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/90">
                        Demo
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[10.5px] text-neon-cyan/60">{side.result.dnaCode}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall */}
          <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="kicker mb-2">Overall answer overlap</p>
              <p className="font-mono text-[44px] font-semibold leading-none text-white">
                {report.overall === null ? '—' : report.overall}
                <span className="ml-1 text-[16px] text-white/35">%</span>
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-white/35">
                Mean of the comparable dimensions on the right. Dimensions with no data on either side are excluded
                rather than counted as zero.
              </p>
            </div>

            <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
              <SectionTitle kicker="Breakdown" title="Every dimension, with its method">
                <span className="inline-flex items-center gap-1">
                  <Info className="h-3 w-3" /> hover a row
                </span>
              </SectionTitle>
              <ul className="space-y-3">
                {report.breakdown.map((row) => (
                  <li key={row.id} title={`${row.method} — ${row.detail}`}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-[12.5px] font-medium text-white/75">{row.label}</span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/50">
                        {row.percent === null ? 'no data' : `${row.percent}%`}
                      </span>
                    </div>
                    <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-neon-cyan/70 to-neon-violet/80"
                        style={{ width: `${row.percent ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10.5px] leading-snug text-white/25">{row.method}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Shared / unique */}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ShareBox title="Shared tags" items={report.sharedTags} tone="accent" />
            <ShareBox title={`Only ${left.profile.nickname || 'left'}`} items={report.uniqueToA} tone="plain" />
            <ShareBox title={`Only ${right.profile.nickname || 'right'}`} items={report.uniqueToB} tone="plain" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="label">Shared interests</p>
              <Chips items={report.sharedInterests} empty="No shared interest domains." />
              <p className="label mt-4">Shared skills</p>
              <Chips items={report.sharedSkills} empty="No shared skills." />
            </div>

            <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="label">Main differences</p>
              {report.differences.length === 0 ? (
                <p className="text-[12px] text-white/30">The two profiles agree on every comparable question.</p>
              ) : (
                <ul className="space-y-2.5">
                  {report.differences.map((d) => (
                    <li key={d.label} className="text-[12px]">
                      <span className="block text-[10.5px] uppercase tracking-[0.12em] text-white/28">{d.label}</span>
                      <span className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-white/60">
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5">{d.a}</span>
                        <span className="text-white/20">vs</span>
                        <span className="rounded bg-white/[0.06] px-1.5 py-0.5">{d.b}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Callout>
              Similarity uses Jaccard for plain sets, weighted Jaccard (Ruzicka) for intensities, and
              1&nbsp;−&nbsp;mean&nbsp;absolute&nbsp;difference for the percentage lists. Two empty sets report “no data”,
              never 100%. Categorical answers are scored by exact equality only.
            </Callout>
          </div>
        </>
      )}
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Candidate[];
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field !py-2.5">
        {options.map((opt) => (
          <option key={opt.key} value={opt.key} className="bg-ink-900">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ShareBox({ title, items, tone }: { title: string; items: string[]; tone: 'accent' | 'plain' }) {
  return (
    <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="label">{title}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-white/25">Nothing here.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className={`rounded-full border px-2 py-0.5 text-[11px] ${
                tone === 'accent'
                  ? 'border-neon-cyan/35 bg-neon-cyan/[0.08] text-neon-cyan/85'
                  : 'border-white/10 bg-white/[0.03] text-white/50'
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-[12px] text-white/25">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55">
          {item}
        </span>
      ))}
    </div>
  );
}
