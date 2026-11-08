import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../store/useApp';
import { generateDna } from '../lib/engine';
import { DnaHelix } from '../components/dna/DnaHelix';
import { validateProfile } from '../lib/profile';

const PHASES = [
  'Canonicalising your answers…',
  'Mapping interest intensity to node brightness…',
  'Wiring skill levels into branch weight…',
  'Distributing habit particles…',
  'Braiding the double helix…',
];

/**
 * Generation screen. The work itself is synchronous and fast (pure math), so
 * this screen exists to make the *traceability* visible rather than to fake a
 * long loading state: it shows the actual steps on the way to the result.
 */
export default function Generate() {
  const navigate = useNavigate();
  const profile = useApp((s) => s.profile);
  const generate = useApp((s) => s.generate);

  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const preview = (() => {
    try {
      if (validateProfile(profile).length > 0) return null;
      return generateDna(profile, 1);
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!preview) {
      setError(validateProfile(profile)[0] ?? 'Your profile is incomplete.');
      return;
    }
    let cancelled = false;
    const advance = (i: number) => {
      if (cancelled) return;
      if (i >= PHASES.length) {
        void (async () => {
          try {
            await generate();
            if (!cancelled) navigate('/dna');
          } catch (err) {
            if (!cancelled) setError(err instanceof Error ? err.message : 'Generation failed.');
          }
        })();
        return;
      }
      setPhase(i);
      window.setTimeout(() => advance(i + 1), 340);
    };
    advance(0);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.hash]);

  if (error) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[15px] font-medium text-white/80">Cannot generate yet</p>
        <p className="max-w-sm text-[13px] text-white/45">{error}</p>
        <button type="button" onClick={() => navigate('/create')} className="btn-primary">
          Go back to the wizard
        </button>
      </div>
    );
  }

  return (
    <div className="shell flex min-h-[70vh] flex-col items-center justify-center py-10">
      <div className="w-full max-w-md">
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-xl3 border border-white/10"
          >
            <DnaHelix result={preview} uid="gen" className="block h-auto w-full" animated />
          </motion.div>
        )}

        <div className="mt-8 space-y-2.5">
          {PHASES.map((label, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <div key={label} className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                    done ? 'bg-neon-cyan' : active ? 'bg-neon-cyan/80 animate-pulse' : 'bg-white/12'
                  }`}
                />
                <span
                  className={`text-[12.5px] transition-colors ${
                    done ? 'text-white/45' : active ? 'text-white/85' : 'text-white/20'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {preview && (
          <p className="mt-7 text-center font-mono text-[11px] tracking-[0.18em] text-neon-cyan/60">
            {preview.dnaCode}
          </p>
        )}
      </div>
    </div>
  );
}
