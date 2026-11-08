import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History, Minus, Plus, TrendingUp } from 'lucide-react';
import { useApp } from '../store/useApp';
import { EmptyState, SectionTitle, Callout } from '../components/ui/Primitives';
import type { DnaVersion } from '../lib/types';

interface Diff {
  addedInterests: string[];
  removedInterests: string[];
  addedSkills: string[];
  removedSkills: string[];
  levelChanges: { label: string; from: string; to: string }[];
  intensityChanges: { label: string; from: number; to: number }[];
  newTags: string[];
  droppedTags: string[];
}

export default function Evolution() {
  const versions = useApp((s) => s.versions);
  const profile = useApp((s) => s.profile);
  const init = useApp((s) => s.init);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    // Ensure versions are fresh when arriving from another tab/route.
    if (versions.length === 0) void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => [...versions].sort((a, b) => a.version - b.version), [versions]);

  if (sorted.length === 0) {
    return (
      <div className="shell py-16">
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title="No history yet"
          hint="Every time you generate a DNA, a version is saved locally. Edit your answers and generate again to start a timeline."
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

  if (sorted.length === 1) {
    return (
      <div className="shell py-10">
        <p className="kicker mb-1.5">DNA Evolution</p>
        <h1 className="h2 text-white/95">Only one version so far</h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-white/45">
          Version 1 · {sorted[0].dnaCode} · {new Date(sorted[0].generatedAt).toLocaleString()}. Change your answers and
          generate again — nothing here is invented on your behalf, so the timeline only grows when you act.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/create" className="btn-primary">
            Update my answers
          </Link>
          <Link to="/dna" className="btn-ghost">
            View current DNA
          </Link>
        </div>
      </div>
    );
  }

  const activeIndex = selected ?? sorted.length - 1;
  const active = sorted[activeIndex];
  const previous = activeIndex > 0 ? sorted[activeIndex - 1] : null;
  const diff = previous ? diffVersions(previous, active) : null;

  return (
    <div className="shell py-6 sm:py-10">
      <div className="mb-6">
        <p className="kicker mb-1.5">DNA Evolution</p>
        <h1 className="h2 text-white/95">How your identity changed</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/45">
          {sorted.length} versions saved on this device. Each dot is a real snapshot you generated — this timeline never
          extrapolates or invents dates.
        </p>
      </div>

      {/* Timeline rail */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {sorted.map((v, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex shrink-0 flex-col items-start gap-1 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                isActive
                  ? 'border-neon-cyan/55 bg-neon-cyan/[0.1]'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/25'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-neon-cyan' : 'bg-white/25'}`} />
                <span className={`text-[12px] font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                  v{v.version}
                </span>
              </span>
              <span className="font-mono text-[10px] text-white/35">{v.dnaCode}</span>
              <span className="text-[10px] text-white/25">
                {new Date(v.generatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected version summary */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle kicker={`Version ${active.version}`} title={active.profile.nickname || profile.nickname} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
            <Stat label="Interests" value={String(active.profile.interests.length)} />
            <Stat label="Skills" value={String(active.profile.skills.length)} />
            <Stat label="DNA code" value={active.dnaCode} mono />
            <Stat label="Generated" value={new Date(active.generatedAt).toLocaleDateString()} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {active.result.tags.slice(0, 8).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/55">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <SectionTitle
            kicker={previous ? `vs v${previous.version}` : 'First version'}
            title={previous ? 'What changed' : 'Baseline'}
          />
          {!previous ? (
            <p className="text-[12.5px] leading-relaxed text-white/40">
              This is the first saved version, so there is nothing earlier to compare against.
            </p>
          ) : diff ? (
            <div className="space-y-4">
              <DiffRow icon={<Plus className="h-3 w-3" />} label="New interests" items={diff.addedInterests} tone="add" />
              <DiffRow icon={<Minus className="h-3 w-3" />} label="Removed interests" items={diff.removedInterests} tone="remove" />
              <DiffRow icon={<Plus className="h-3 w-3" />} label="New skills" items={diff.addedSkills} tone="add" />
              <DiffRow icon={<Minus className="h-3 w-3" />} label="Removed skills" items={diff.removedSkills} tone="remove" />

              {diff.levelChanges.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-white/30">
                    <TrendingUp className="h-3 w-3" /> Skill level changes
                  </p>
                  <ul className="space-y-1">
                    {diff.levelChanges.map((c) => (
                      <li key={c.label} className="text-[12px] text-white/55">
                        {c.label}: <span className="text-white/35">{c.from}</span> → <span className="text-neon-cyan/80">{c.to}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diff.intensityChanges.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10.5px] uppercase tracking-[0.12em] text-white/30">Interest intensity changes</p>
                  <ul className="space-y-1">
                    {diff.intensityChanges.map((c) => (
                      <li key={c.label} className="text-[12px] text-white/55">
                        {c.label}: <span className="text-white/35">{c.from}/5</span> → <span className="text-neon-cyan/80">{c.to}/5</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <DiffRow icon={<Plus className="h-3 w-3" />} label="New tags" items={diff.newTags} tone="add" />
              <DiffRow icon={<Minus className="h-3 w-3" />} label="Dropped tags" items={diff.droppedTags} tone="remove" />

              {isEmptyDiff(diff) && (
                <p className="text-[12.5px] text-white/35">
                  The answers are identical between these versions, so only the version number changed.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <Callout>
          Versions are stored locally in IndexedDB and included in the JSON export. Deleting your data in Settings
          removes the whole timeline — there is no server copy to fall back on.
        </Callout>
      </div>
    </div>
  );
}

function diffVersions(prev: DnaVersion, next: DnaVersion): Diff {
  const prevInterests = new Map(prev.profile.interests.map((i) => [i.id, i]));
  const nextInterests = new Map(next.profile.interests.map((i) => [i.id, i]));
  const prevSkills = new Map(prev.profile.skills.map((s) => [s.id, s]));
  const nextSkills = new Map(next.profile.skills.map((s) => [s.id, s]));

  const addedInterests = [...nextInterests.keys()].filter((id) => !prevInterests.has(id)).map((id) => nextInterests.get(id)!.label);
  const removedInterests = [...prevInterests.keys()].filter((id) => !nextInterests.has(id)).map((id) => prevInterests.get(id)!.label);
  const addedSkills = [...nextSkills.keys()].filter((id) => !prevSkills.has(id)).map((id) => nextSkills.get(id)!.label);
  const removedSkills = [...prevSkills.keys()].filter((id) => !nextSkills.has(id)).map((id) => prevSkills.get(id)!.label);

  const levelChanges: Diff['levelChanges'] = [];
  for (const [id, nextSkill] of nextSkills) {
    const prevSkill = prevSkills.get(id);
    if (prevSkill && prevSkill.level !== nextSkill.level) {
      levelChanges.push({ label: nextSkill.label, from: prevSkill.level, to: nextSkill.level });
    }
  }

  const intensityChanges: Diff['intensityChanges'] = [];
  for (const [id, nextInterest] of nextInterests) {
    const prevInterest = prevInterests.get(id);
    if (prevInterest && prevInterest.intensity !== nextInterest.intensity) {
      intensityChanges.push({ label: nextInterest.label, from: prevInterest.intensity, to: nextInterest.intensity });
    }
  }

  const prevTags = new Set(prev.result.tags);
  const nextTags = new Set(next.result.tags);

  return {
    addedInterests,
    removedInterests,
    addedSkills,
    removedSkills,
    levelChanges,
    intensityChanges,
    newTags: [...nextTags].filter((t) => !prevTags.has(t)).slice(0, 10),
    droppedTags: [...prevTags].filter((t) => !nextTags.has(t)).slice(0, 10),
  };
}

function isEmptyDiff(d: Diff): boolean {
  return (
    d.addedInterests.length === 0 &&
    d.removedInterests.length === 0 &&
    d.addedSkills.length === 0 &&
    d.removedSkills.length === 0 &&
    d.levelChanges.length === 0 &&
    d.intensityChanges.length === 0 &&
    d.newTags.length === 0 &&
    d.droppedTags.length === 0
  );
}

function DiffRow({ icon, label, items, tone }: { icon: React.ReactNode; label: string; items: string[]; tone: 'add' | 'remove' }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-white/30">
        {icon}
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-full border px-2 py-0.5 text-[11px] ${
              tone === 'add'
                ? 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-200/80'
                : 'border-red-400/25 bg-red-400/[0.06] text-red-200/70'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-[0.12em] text-white/28">{label}</dt>
      <dd className={`mt-0.5 text-white/75 ${mono ? 'font-mono text-[11.5px]' : 'text-[13px]'}`}>{value}</dd>
    </div>
  );
}
