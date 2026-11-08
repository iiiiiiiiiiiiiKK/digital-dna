import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Fingerprint, Share2, Lock, Github } from 'lucide-react';
import { useApp } from '../store/useApp';
import { DnaHelix } from '../components/dna/DnaHelix';
import { DEMO_RESULTS } from '../lib/demo';
import { profileCompleteness } from '../lib/profile';
import { AUTHOR_HANDLE, AUTHOR_X_URL, XIcon } from '../components/icons/XIcon';
import type { DnaResult } from '../lib/types';

/**
 * Landing page. One job: make "I can create my own digital DNA" unmistakable
 * within two seconds, then get out of the way.
 */
export default function Home() {
  const profile = useApp((s) => s.profile);
  const result = useApp((s) => s.result);
  const versions = useApp((s) => s.versions);
  const completeness = profileCompleteness(profile);
  const hasProfile = completeness > 0 && profile.nickname.trim().length > 0;

  // A rotating showcase, but only from real generated/demo geometry — never a
  // stock image.
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const showcase: { profileName: string; result: DnaResult; demo: boolean }[] = useMemo(() => {
    const items = DEMO_RESULTS.map((d) => ({ profileName: d.profile.nickname, result: d.result, demo: true }));
    if (result) items.unshift({ profileName: profile.nickname || 'You', result, demo: false });
    return items;
  }, [result, profile.nickname]);

  useEffect(() => {
    if (showcase.length < 2) return;
    const id = window.setInterval(() => setShowcaseIndex((i) => (i + 1) % showcase.length), 7000);
    return () => window.clearInterval(id);
  }, [showcase.length]);

  const active = showcase[Math.min(showcaseIndex, showcase.length - 1)];

  return (
    <div className="pb-10">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="shell pt-8 sm:pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-neon-cyan" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                Digital identity engine
              </span>
            </div>

            <h1 className="h1 text-balance">
              Your Identity.
              <br />
              <span className="bg-gradient-to-r from-neon-cyan via-[#8fd4ff] to-neon-violet bg-clip-text text-transparent">
                Your Digital DNA.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/55 sm:text-base">
              Answer a handful of questions about what you like, what you can do and how you work. Get a double helix
              that is actually yours — every curve traceable to something you chose.
              <span className="mt-2 block text-white/35">
                每个人都有独一无二的数字基因。
              </span>
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/create" className="btn-primary w-full !py-3.5 text-[15px] sm:w-auto sm:!px-7">
                Create My DNA
                <ArrowRight className="h-4 w-4" />
              </Link>
              {hasProfile && versions.length > 0 ? (
                <Link to="/dna" className="btn-ghost w-full sm:w-auto">
                  View my helix
                </Link>
              ) : (
                <Link to="/compare" className="btn-ghost w-full sm:w-auto">
                  See a live sample
                </Link>
              )}
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-white/35">
              <li className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Stored only in your browser
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Fingerprint className="h-3.5 w-3.5" /> Same answers, same DNA
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> PNG export &amp; share link
              </li>
            </ul>
          </motion.div>

          {/* Live helix preview — the product's own renderer, not an image. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="panel overflow-hidden p-1.5">
              <div className="overflow-hidden rounded-[22px]">
                {active && (
                  <DnaHelix
                    result={active.result}
                    uid="hero"
                    className="block h-auto w-full"
                    compact={false}
                  />
                )}
              </div>
            </div>

            {active && (
              <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] tracking-wider text-neon-cyan/80">{active.result.dnaCode}</span>
                  {active.demo && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">
                      Demo
                    </span>
                  )}
                </div>
                <span className="truncate text-white/35">{active.profileName}</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Signals */}
      <section className="shell mt-14 sm:mt-20">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              k: '01',
              t: 'Answer, don’t be judged',
              d: 'Seven short steps. Nothing is measured — the engine only rearranges what you typed.',
            },
            {
              k: '02',
              t: 'A helix you can read',
              d: 'Interest intensity sets node brightness. Skill level sets branch weight. Habit count sets the particles.',
            },
            {
              k: '03',
              t: 'Yours to keep',
              d: 'Export a 1080px card, a 1080×1920 poster, or a full JSON backup. Delete it all in one click.',
            },
          ].map((item) => (
            <div key={item.k} className="rounded-xl2 border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="font-mono text-[11px] tracking-[0.2em] text-neon-cyan/60">{item.k}</p>
              <p className="mt-2 text-[14px] font-semibold text-white/85">{item.t}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/40">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Demo reel */}
      <section className="shell mt-14 sm:mt-20">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="kicker mb-1.5">Sample outputs</p>
            <h2 className="h2 text-white/90">Same engine, different answers</h2>
          </div>
          <Link to="/compare" className="hidden shrink-0 text-[13px] text-white/45 hover:text-white sm:block">
            Compare two →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_RESULTS.map((demo) => (
            <div key={demo.profile.id} className="overflow-hidden rounded-xl3 border border-white/[0.07] bg-white/[0.02]">
              <DnaHelix result={demo.result} uid={`demo-${demo.profile.id}`} className="block h-auto w-full" compact />
              <div className="flex items-start justify-between gap-3 border-t border-white/[0.06] px-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-white/85">{demo.profile.nickname}</p>
                    <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/90">
                      Demo
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-white/35">{demo.result.archetype.title}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-neon-cyan/70">{demo.result.dnaCode}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- Author / open */}
      <section className="shell mt-14 sm:mt-20">
        <div className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="min-w-0">
            <p className="kicker mb-2">Open source</p>
            <p className="text-[15px] font-semibold text-white/85">Built in the open. MIT licensed.</p>
            <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-white/40">
              No backend, no analytics, no accounts. Read every line, fork it, host it yourself.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <a
              href={AUTHOR_X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !py-2.5 text-[13px]"
            >
              <XIcon className="h-3.5 w-3.5" />
              {AUTHOR_HANDLE}
            </a>
            <a
              href="https://github.com/iiiiiiiiiiiiiKK/digital-dna"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !py-2.5 text-[13px]"
            >
              <Github className="h-3.5 w-3.5" />
              Repository
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
