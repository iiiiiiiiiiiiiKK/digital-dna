import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MAPPING_RULES } from '../../lib/engine';

/**
 * Transparency panel. The engine has no hidden heuristics, so the full mapping
 * table and the exact formulas are shown to anyone who opens this.
 */
export function EngineExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl2 border border-white/[0.08] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-[12.5px] font-semibold text-white/70">How this was calculated</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/35 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/[0.06] px-4 py-4">
          <div>
            <p className="label">Visual mapping</p>
            <ul className="space-y-1.5">
              {MAPPING_RULES.map((rule) => (
                <li key={rule.from} className="flex flex-wrap items-baseline gap-x-2 text-[12px] text-white/45">
                  <span className="text-white/70">{rule.from}</span>
                  <span className="text-white/20">→</span>
                  <span>{rule.to}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label">Formulas</p>
            <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-white/40">
              <li>
                interest% = round(90 × (i / 5) + 10 × (i / 5) × min(n, 20) / 20)
                <span className="ml-2 font-sans text-white/25">i = your 1–5 intensity, n = how many you picked</span>
              </li>
              <li>
                skill% = round(92 × level + 8 × (level / 100) × min(m, 15) / 15)
                <span className="ml-2 font-sans text-white/25">level = 25/50/75/100 for your own Beginner→Expert rating</span>
              </li>
              <li>
                seed = FNV-1a-32(canonical JSON of your answers)
                <span className="ml-2 font-sans text-white/25">identical answers → identical seed</span>
              </li>
              <li>
                dnaCode = &quot;DNA-&quot; + first 6 hex of FNV-1a-64(seed + profile salt)
                <span className="ml-2 font-sans text-white/25">salt keeps numbers unique between local profiles</span>
              </li>
            </ul>
          </div>

          <p className="text-[11.5px] leading-relaxed text-white/30">
            No randomness, no AI, no server inference is involved in the core generation. Two identical sets of answers
            always produce byte-identical numbers, colours and geometry.
          </p>
        </div>
      )}
    </div>
  );
}
