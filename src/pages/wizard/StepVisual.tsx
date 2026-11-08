import { useApp } from '../../store/useApp';
import { VISUAL_STYLES } from '../../lib/catalog';
import type { VisualStyleId } from '../../lib/types';

/** Step 6 — visual preference. This choice drives the whole render style. */
export function StepVisual() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);

  return (
    <div className="space-y-5">
      <p className="text-[13px] leading-relaxed text-white/45">
        Pick the aesthetic for your artwork. This changes the palette, the glow strength and the background — the
        underlying helix geometry still comes from your answers.
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {VISUAL_STYLES.map((style) => {
          const active = profile.visualStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => updateProfile({ visualStyle: style.id as VisualStyleId })}
              aria-pressed={active}
              className={`group overflow-hidden rounded-xl border text-left transition-all ${
                active ? 'border-neon-cyan/65 ring-1 ring-neon-cyan/25' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div
                className="h-16 w-full sm:h-20"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${style.swatch[1]}, transparent 62%), radial-gradient(circle at 72% 78%, ${style.swatch[2]}, transparent 58%), ${style.swatch[0]}`,
                }}
              />
              <div className="bg-white/[0.02] px-3 py-2.5">
                <p className={`text-[12.5px] font-semibold ${active ? 'text-white' : 'text-white/75'}`}>{style.label}</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-white/30">{style.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
