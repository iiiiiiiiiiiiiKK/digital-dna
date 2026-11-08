import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { SKILL_CATALOG, SKILL_LEVELS } from '../../lib/catalog';
import { CustomAdd, CustomList } from '../../components/ui/Controls';
import { tidyText } from '../../lib/profile';
import type { SkillItem, SkillLevel } from '../../lib/types';

/** Step 3 — skill genes. Levels are explicitly self-assessed. */
export function StepSkills() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const selected = profile.skills;
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const toggle = (id: string) => {
    if (selectedIds.has(id)) {
      updateProfile({ skills: selected.filter((s) => s.id !== id) });
      return;
    }
    const entry = SKILL_CATALOG.find((c) => c.id === id);
    if (!entry) return;
    updateProfile({ skills: [...selected, { id: entry.id, label: entry.label, level: 'intermediate' }] });
  };

  const setLevel = (id: string, level: SkillLevel) => {
    updateProfile({ skills: selected.map((s) => (s.id === id ? { ...s, level } : s)) });
  };

  const addCustom = (raw: string) => {
    const label = tidyText(raw, 30);
    if (label.length < 2) return;
    if (selected.some((s) => s.label.toLowerCase() === label.toLowerCase())) return;
    const item: SkillItem = {
      id: `custom:${label.toLowerCase().replace(/\s+/g, '-').slice(0, 24)}`,
      label,
      level: 'intermediate',
      custom: true,
    };
    updateProfile({ skills: [...selected, item] });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="label !mb-0">
            What can you do? <span className="text-neon-cyan/70">min 1</span>
          </span>
          <span className="font-mono text-[11px] text-white/30">{selected.length} selected</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {SKILL_CATALOG.map((opt) => {
            const active = selectedIds.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                aria-pressed={active}
                className={`flex min-h-[44px] items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left text-[12.5px] font-medium transition-all ${
                  active
                    ? 'border-neon-violet/55 bg-neon-violet/[0.12] text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                <span className="min-w-0 truncate">{opt.label}</span>
                {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-violet" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="label">Add your own</span>
        <CustomAdd label="Add custom skill" placeholder="e.g. 3D printing" onAdd={addCustom} max={30} />
        <div className="mt-3">
          <CustomList
            items={selected}
            onRemove={(id) => updateProfile({ skills: selected.filter((s) => s.id !== id) })}
            emptyHint="Custom skills you add appear here."
          />
        </div>
      </div>

      {selected.length > 0 && (
        <div>
          <span className="label">Your level (you decide)</span>
          <ul className="space-y-3">
            {selected.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                <span className="mb-2 block truncate text-[13px] font-medium text-white/85">{item.label}</span>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {SKILL_LEVELS.map((level) => {
                    const active = item.level === level.id;
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setLevel(item.id, level.id as SkillLevel)}
                        aria-pressed={active}
                        className={`min-h-[38px] rounded-lg border text-[11.5px] font-semibold transition-all ${
                          active
                            ? 'border-neon-violet/60 bg-neon-violet/15 text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20'
                        }`}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
            <p className="text-[11.5px] leading-relaxed text-amber-100/70">
              These levels are <strong className="font-semibold">your own self-assessment</strong>. Digital DNA does not
              test, verify or measure ability — it only draws what you tell it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
