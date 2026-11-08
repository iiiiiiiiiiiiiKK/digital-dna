import { useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { profileCompleteness, validateProfile } from '../../lib/profile';
import { generateDna } from '../../lib/engine';
import { DnaHelix } from '../../components/dna/DnaHelix';
import { VISUAL_STYLES } from '../../lib/catalog';

/** Step 7 — review before generation, with a live preview of the real result. */
export function WizardReview() {
  const profile = useApp((s) => s.profile);
  const problems = validateProfile(profile);
  const completeness = profileCompleteness(profile);

  // Preview uses the same engine, so what you see is exactly what gets saved.
  const preview = useMemo(() => {
    if (problems.length > 0) return null;
    return generateDna(profile, 1);
  }, [profile, problems.length]);

  const styleLabel = VISUAL_STYLES.find((s) => s.id === profile.visualStyle)?.label ?? profile.visualStyle;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[15px] font-semibold text-white/35">
                  {(profile.nickname || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold text-white">{profile.nickname || 'Unnamed'}</p>
              <p className="truncate text-[12px] text-white/40">
                {[profile.role, profile.field].filter(Boolean).join(' · ') || 'No role or field given'}
              </p>
            </div>
          </div>

          {profile.bio && <p className="text-[13px] leading-relaxed text-white/50">{profile.bio}</p>}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
            <Row label="Interests" value={`${profile.interests.length} chosen`} />
            <Row label="Skills" value={`${profile.skills.length} chosen`} />
            <Row label="Creates" value={`${profile.creative.outputs.length} types`} />
            <Row label="Habits" value={`${profile.habits.platforms.length + profile.habits.tools.length} platforms/tools`} />
            <Row label="Visual style" value={styleLabel} />
            <Row label="Profile filled" value={`${completeness}%`} />
          </dl>

          {profile.interests.length > 0 && (
            <div>
              <p className="label">Top interests</p>
              <div className="flex flex-wrap gap-1.5">
                {[...profile.interests]
                  .sort((a, b) => b.intensity - a.intensity)
                  .slice(0, 8)
                  .map((i) => (
                    <span key={i.id} className="chip !py-1 text-[11.5px]">
                      {i.label}
                      <span className="font-mono text-[10px] text-neon-cyan/70">{i.intensity}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl2 border border-white/[0.08] bg-black/25">
          {preview ? (
            <DnaHelix result={preview} uid="review" className="block h-auto w-full" compact />
          ) : (
            <div className="grid aspect-[1000/640] place-items-center px-6 text-center">
              <p className="text-[12.5px] text-white/35">Fill the required fields to preview your helix.</p>
            </div>
          )}
        </div>
      </div>

      {problems.length > 0 ? (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3">
          <p className="mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-amber-100/90">
            <AlertCircle className="h-3.5 w-3.5" />
            Still needed
          </p>
          <ul className="space-y-1 pl-5 text-[12px] text-amber-100/70">
            {problems.map((p) => (
              <li key={p} className="list-disc">
                {p}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/90" />
          <p className="text-[12.5px] leading-relaxed text-emerald-100/75">
            Ready. Pressing generate hashes your answers into a DNA number and a helix geometry — the same answers will
            always produce the same result.
          </p>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-white/25">
        Reminder: this is not a personality test. The result restates the options you selected; it makes no claim about
        who you are beyond what you typed.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-[0.14em] text-white/28">{label}</dt>
      <dd className="mt-0.5 text-white/70">{value}</dd>
    </div>
  );
}
