import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Github, Settings2, Dna } from 'lucide-react';
import { AUTHOR_HANDLE, AUTHOR_X_URL, XIcon } from '../icons/XIcon';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/create', label: 'Create' },
  { to: '/dna', label: 'My DNA' },
  { to: '/compare', label: 'Compare' },
  { to: '/evolution', label: 'Evolution' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 safe-top transition-colors duration-300 ${
        scrolled ? 'border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="shell flex h-14 items-center gap-3 sm:h-16">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5" aria-label="Digital DNA home">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/[0.04]">
            <Dna className="h-4 w-4 text-neon-cyan" strokeWidth={2.2} />
          </span>
          <span className="truncate text-[13px] font-semibold tracking-[0.16em] text-white/90 group-hover:text-white">
            DIGITAL DNA
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `inline-flex min-h-[40px] items-center rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:text-white/90'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Author link — always visible, on every screen size. */}
          <a
            href={AUTHOR_X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-white/65 transition-colors hover:border-white/25 hover:text-white"
            aria-label={`Author on X: ${AUTHOR_HANDLE}`}
            title={`Author · ${AUTHOR_HANDLE}`}
          >
            <XIcon className="h-[13px] w-[13px]" />
            <span className="hidden text-[12px] font-semibold tracking-wide sm:inline">{AUTHOR_HANDLE}</span>
          </a>

          <NavLink
            to="/settings"
            className="hidden h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:border-white/25 hover:text-white sm:grid"
            aria-label="Settings"
          >
            <Settings2 className="h-[15px] w-[15px]" />
          </NavLink>

          <Link to="/create" className="btn-primary hidden !px-4 !py-2 text-[13px] md:inline-flex">
            Create My DNA
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="lg:hidden">
          <div className="border-t border-white/[0.06] bg-ink-950/97 backdrop-blur-xl">
            <div className="shell flex flex-col gap-1 py-3 safe-bottom">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex min-h-[46px] items-center rounded-xl px-3 text-[15px] font-medium ${
                      isActive ? 'bg-white/[0.07] text-white' : 'text-white/65'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/settings"
                className="flex min-h-[46px] items-center rounded-xl px-3 text-[15px] font-medium text-white/65"
              >
                Settings
              </NavLink>

              <Link to="/create" className="btn-primary mt-2 w-full">
                Create My DNA
              </Link>

              <a
                href={AUTHOR_X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex min-h-[46px] items-center gap-2 rounded-xl px-3 text-[15px] text-white/55"
              >
                <XIcon className="h-4 w-4" />
                <span>Author · {AUTHOR_HANDLE}</span>
              </a>

              <a
                href="https://github.com/iiiiiiiiiiiiiKK/digital-dna"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[46px] items-center gap-2 rounded-xl px-3 text-[15px] text-white/55"
              >
                <Github className="h-4 w-4" />
                <span>Source code</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
