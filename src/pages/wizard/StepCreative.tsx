import { useApp } from '../../store/useApp';
import {
  CREATIVE_OUTPUT_OPTIONS,
  EXPLORATION_OPTIONS,
  PACE_OPTIONS,
  THINKING_OPTIONS,
  WORK_STYLE_OPTIONS,
} from '../../lib/catalog';
import { SegmentedCard } from '../../components/ui/Controls';
import type { CreativeOutput, ExplorationStyle, PaceStyle, ThinkingMode, WorkStyle } from '../../lib/types';

/** Step 4 — creative genes. Plain questions, no psychology jargon. */
export function StepCreative() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);

  const toggleOutput = (id: CreativeOutput) => {
    const current = profile.creative.outputs;
    const next = current.includes(id) ? current.filter((o) => o !== id) : [...current, id];
    updateProfile({ creative: { ...profile.creative, outputs: next } });
  };

  return (
    <div className="space-y-7">
      <div>
        <span className="label">
          What do you most like to make? <span className="text-neon-cyan/70">pick any</span>
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CREATIVE_OUTPUT_OPTIONS.map((opt) => {
            const active = profile.creative.outputs.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOutput(opt.id)}
                aria-pressed={active}
                className={`flex min-h-[58px] flex-col justify-center gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                  active
                    ? 'border-neon-cyan/55 bg-neon-cyan/[0.1]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-white/75'}`}>
                  {opt.label}
                </span>
                <span className="text-[11px] leading-snug text-white/35">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="label">Do you prefer working alone or with others?</span>
        <SegmentedCard
          options={WORK_STYLE_OPTIONS}
          value={profile.creative.workStyle}
          onChange={(id) => updateProfile({ creative: { ...profile.creative, workStyle: id as WorkStyle } })}
        />
      </div>

      <div>
        <span className="label">New territory or deeper roots?</span>
        <SegmentedCard
          options={EXPLORATION_OPTIONS}
          value={profile.creative.exploration}
          onChange={(id) => updateProfile({ creative: { ...profile.creative, exploration: id as ExplorationStyle } })}
        />
      </div>

      <div>
        <span className="label">How do you think best?</span>
        <SegmentedCard
          columns={2}
          options={THINKING_OPTIONS}
          value={profile.creative.thinking}
          onChange={(id) => updateProfile({ creative: { ...profile.creative, thinking: id as ThinkingMode } })}
        />
      </div>

      <div>
        <span className="label">Quick iterations, or long polishing?</span>
        <SegmentedCard
          options={PACE_OPTIONS}
          value={profile.creative.pace}
          onChange={(id) => updateProfile({ creative: { ...profile.creative, pace: id as PaceStyle } })}
        />
      </div>
    </div>
  );
}
