import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { AUTHOR_HANDLE, AUTHOR_X_URL, XIcon } from '../icons/XIcon';

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/[0.06]">
      <div className="shell flex flex-col gap-6 py-8 safe-bottom sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-[13px] font-semibold tracking-[0.18em] text-white/80">DIGITAL DNA</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45">
              Your Identity. Your Digital DNA.
              <br />
              Local-first. No account, no tracking, nothing uploaded.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[13px] sm:flex sm:gap-10">
            <div className="flex flex-col">
              <span className="mb-1 text-[11px] uppercase tracking-[0.16em] text-white/30">Product</span>
              <Link to="/create" className="inline-flex min-h-[40px] items-center text-white/55 hover:text-white">
                Create
              </Link>
              <Link to="/compare" className="inline-flex min-h-[40px] items-center text-white/55 hover:text-white">
                Compare
              </Link>
              <Link to="/evolution" className="inline-flex min-h-[40px] items-center text-white/55 hover:text-white">
                Evolution
              </Link>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-[11px] uppercase tracking-[0.16em] text-white/30">More</span>
              <Link to="/settings" className="inline-flex min-h-[40px] items-center text-white/55 hover:text-white">
                Settings
              </Link>
              <a
                href="https://github.com/iiiiiiiiiiiiiKK/digital-dna"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center text-white/55 hover:text-white"
              >
                Source (MIT)
              </a>
            </div>
          </div>
        </div>

        <div className="hairline" />

        <div className="flex flex-col-reverse items-start gap-3 text-[12px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Digital DNA · Open source under the MIT License. Results are derived from your
            own answers, not a psychological assessment.
          </p>
          <div className="flex items-center gap-2">
            <a
              href={AUTHOR_X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-white/60 transition-colors hover:border-white/25 hover:text-white"
            >
              <XIcon className="h-3 w-3" />
              {AUTHOR_HANDLE}
            </a>
            <a
              href="https://github.com/iiiiiiiiiiiiiKK/digital-dna"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-white/10 px-2.5 text-white/60 transition-colors hover:border-white/25 hover:text-white"
              aria-label="GitHub repository"
            >
              <Github className="h-3 w-3" />
              Star
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
