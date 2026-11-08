import { useMemo } from 'react';
import { Sliders } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { INTEREST_CATALOG, INTENSITY_LABELS } from '../../lib/catalog';
import { CustomAdd, CustomList, IntensityPicker } from '../../components/ui/Controls';
import { tidyText } from '../../lib/profile';
import type { InterestItem, InterestIntensity } from '../../lib/types';

/** Step 2 — interest genes. Multi-select with a per-item intensity. */
export function StepInterests() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const selected = profile.interests;
  const selectedIds = useMemo(() => new Set(selected.map((i) => i.id)), [selected]);

  const toggle = (id: string) => {
    if (selectedIds.has(id)) {
      updateProfile({ interests: selected.filter((i) => i.id !== id) });
      return;
    }
    const entry = INTEREST_CATALOG.find((c) => c.id === id);
    if (!entry) return;
    updateProfile({ interests: [...selected, { id: entry.id, label: entry.label, intensity: 3 }] });
  };

  const setIntensity = (id: string, intensity: InterestIntensity) => {
    updateProfile({ interests: selected.map((i) => (i.id === id ? { ...i, intensity } : i)) });
  };

  const addCustom = (raw: string) => {
    const label = tidyText(raw, 30);
    if (label.length < 2) return;
    if (selected.some((i) => i.label.toLowerCase() === label.toLowerCase())) return;
    const item: InterestItem = {
      id: `custom:${label.toLowerCase().replace(/\s+/g, '-').slice(0, 24)}`,
      label,
      intensity: 3,
      custom: true,
    };
    updateProfile({ interests: [...selected, item] });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="label !mb-0">
            Pick your domains <span className="text-neon-cyan/70">min 1</span>
          </span>
          <span className="font-mono text-[11px] text-white/30">{selected.length} selected</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {INTEREST_CATALOG.map((opt) => {
            const active = selectedIds.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                aria-pressed={active}
                className={`flex min-h-[44px] items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left text-[12.5px] font-medium transition-all ${
                  active
                    ? 'border-neon-cyan/55 bg-neon-cyan/[0.11] text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/25 hover:text-white'
                }`}
              >
                <span className="min-w-0 truncate">{opt.label}</span>
                {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neon-cyan" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="label">Add your own</span>
        <CustomAdd label="Add custom interest" placeholder="e.g. Mechanical keyboards" onAdd={addCustom} max={30} />
        <div className="mt-3">
          <CustomList
            items={selected}
            onRemove={(id) => updateProfile({ interests: selected.filter((i) => i.id !== id) })}
            emptyHint="Custom domains you add appear here."
          />
        </div>
      </div>

      {selected.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-neon-cyan/70" />
            <span className="label !mb-0">How into each one are you? (1–5)</span>
          </div>
          <ul className="space-y-3">
            {selected.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[13px] font-medium text-white/85">{item.label}</span>
                  <span className="shrink-0 text-[11px] text-neon-cyan/70">{INTENSITY_LABELS[item.intensity]}</span>
                </div>
                <IntensityPicker
                  value={item.intensity}
                  onChange={(v) => setIntensity(item.id, v)}
                  labels={INTENSITY_LABELS}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] leading-relaxed text-white/30">
            Intensity drives how bright each node on your helix glows. It is a slider you control, not a score we
            calculate.
          </p>
        </div>
      )}
    </div>
  );
}
