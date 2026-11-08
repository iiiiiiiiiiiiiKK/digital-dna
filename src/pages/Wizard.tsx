import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from 'lucide-react';
import { useApp } from '../store/useApp';
import { validateProfile } from '../lib/profile';
import { StepBasics } from './wizard/StepBasics';
import { StepInterests } from './wizard/StepInterests';
import { StepSkills } from './wizard/StepSkills';
import { StepCreative } from './wizard/StepCreative';
import { StepHabits } from './wizard/StepHabits';
import { StepVisual } from './wizard/StepVisual';
import { WizardReview } from './wizard/WizardReview';

const STEPS = [
  { id: 1, title: 'Identity', short: 'Identity', hint: 'Who is this helix for?' },
  { id: 2, title: 'Interest genes', short: 'Interests', hint: 'What pulls your attention?' },
  { id: 3, title: 'Skill genes', short: 'Skills', hint: 'What can you do, by your own measure?' },
  { id: 4, title: 'Creative genes', short: 'Creative', hint: 'How do you like to work?' },
  { id: 5, title: 'Digital habits', short: 'Habits', hint: 'What does your digital day look like?' },
  { id: 6, title: 'Visual style', short: 'Style', hint: 'Pick the aesthetic.' },
  { id: 7, title: 'Review & generate', short: 'Review', hint: 'One last look before sequencing.' },
] as const;

export default function Wizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profile = useApp((s) => s.profile);
  const step = useApp((s) => s.wizardStep);
  const setStep = useApp((s) => s.setStep);
  const persistDraft = useApp((s) => s.persistDraft);
  const generate = useApp((s) => s.generate);
  const busy = useApp((s) => s.busy);
  const draftSavedAt = useApp((s) => s.draftSavedAt);
  const [localError, setLocalError] = useState<string | null>(null);
  const deepLinked = useRef(false);

  const safeStep = Math.min(Math.max(step, 0), STEPS.length - 1);
  const current = STEPS[safeStep];
  const problems = useMemo(() => validateProfile(profile), [profile]);

  // Deep link support: /create?step=3 jumps straight to a step (1-based).
  useEffect(() => {
    if (deepLinked.current) return;
    const raw = searchParams.get('step');
    if (!raw) return;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      deepLinked.current = true;
      setStep(Math.min(Math.max(parsed - 1, 0), STEPS.length - 1));
    }
  }, [searchParams, setStep]);

  // Persist progress whenever the step changes so a refresh never loses work.
  useEffect(() => {
    void persistDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStep]);

  const goNext = async () => {
    setLocalError(null);
    if (safeStep < STEPS.length - 1) {
      setStep(safeStep + 1);
      return;
    }
    if (problems.length > 0) {
      setLocalError(problems[0]);
      return;
    }
    try {
      await generate();
      navigate('/dna');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Generation failed.');
    }
  };

  const goBack = () => {
    setLocalError(null);
    if (safeStep === 0) navigate('/');
    else setStep(safeStep - 1);
  };

  const canAdvance = (() => {
    if (safeStep === 0) return profile.nickname.trim().length > 0;
    if (safeStep === 1) return profile.interests.length > 0;
    if (safeStep === 2) return profile.skills.length > 0;
    if (safeStep === 3) return profile.creative.outputs.length > 0;
    return true;
  })();

  const progress = ((safeStep + 1) / STEPS.length) * 100;

  return (
    <div className="shell py-6 sm:py-10">
      {/* Progress rail ------------------------------------------------- */}
      <div className="mb-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="kicker mb-1.5">
              Step {current.id} of {STEPS.length}
            </p>
            <h1 className="truncate text-[20px] font-semibold tracking-tight text-white sm:text-2xl">{current.title}</h1>
          </div>
          <button
            type="button"
            onClick={() => void persistDraft()}
            className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[11.5px] text-white/35 transition-colors hover:text-white/70"
            title="Save progress"
            aria-label="Save progress"
          >
            <Save className="h-3.5 w-3.5" />
            {draftSavedAt ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Step pips: tappable on desktop, scrollable on phones. */}
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
          {STEPS.map((s, i) => {
            const done = i < safeStep;
            const active = i === safeStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Step ${s.id}: ${s.title}`}
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-neon-cyan/55 bg-neon-cyan/10 text-white'
                    : done
                      ? 'border-white/10 bg-white/[0.04] text-white/55'
                      : 'border-white/[0.06] text-white/25'
                }`}
              >
                {done ? <Check className="h-3 w-3 text-neon-cyan/80" strokeWidth={3} /> : <span>{s.id}</span>}
                <span className={active ? 'inline' : 'hidden sm:inline'}>{s.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step body ------------------------------------------------------ */}
      <div className="panel p-5 sm:p-7">
        <p className="mb-5 text-[13px] leading-relaxed text-white/40">{current.hint}</p>

        {/* Step body.
            A plain keyed container with a CSS entrance animation — not
            AnimatePresence — because a waiting-exit animation can re-mount the
            step while the user is typing in it. */}
        <div key={current.id} className="animate-fadeUp">
          {safeStep === 0 && <StepBasics />}
          {safeStep === 1 && <StepInterests />}
          {safeStep === 2 && <StepSkills />}
          {safeStep === 3 && <StepCreative />}
          {safeStep === 4 && <StepHabits />}
          {safeStep === 5 && <StepVisual />}
          {safeStep === 6 && <WizardReview />}
        </div>

        {localError && (
          <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/[0.07] px-4 py-3 text-[12.5px] text-red-200/90">
            {localError}
          </div>
        )}
      </div>

      {/* Nav ------------------------------------------------------------ */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-white/[0.06] bg-ink-950/92 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-2.5 safe-bottom">
          <button type="button" onClick={goBack} className="btn-ghost shrink-0 !px-4" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            type="button"
            onClick={() => void goNext()}
            disabled={!canAdvance || busy}
            className="btn-primary flex-1 !py-3 sm:ml-auto sm:flex-none sm:!px-7"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sequencing…
              </>
            ) : safeStep === STEPS.length - 1 ? (
              <>
                Generate my DNA
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
