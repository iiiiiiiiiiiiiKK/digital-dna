import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './store/useApp';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import Home from './pages/Home';

// Route-level code splitting: the landing page ships immediately, every heavier
// screen (charts, wizard, export pipeline) is fetched on demand. This keeps the
// first paint fast on a phone over a slow connection.
const Wizard = lazy(() => import('./pages/Wizard'));
const Generate = lazy(() => import('./pages/Generate'));
const DnaResultPage = lazy(() => import('./pages/DnaResult'));
const Compare = lazy(() => import('./pages/Compare'));
const Evolution = lazy(() => import('./pages/Evolution'));
const ShareView = lazy(() => import('./pages/ShareView'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const init = useApp((s) => s.init);
  const ready = useApp((s) => s.ready);
  const location = useLocation();

  useEffect(() => {
    void init();
  }, [init]);

  // Restore scroll position on navigation — matches native app feel on iOS.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-ink-950">
      <AmbientBackdrop />
      <SiteHeader />
      <main className="relative z-10 flex-1">
        {!ready ? (
          <BootScreen />
        ) : (
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Wizard />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/dna" element={<DnaResultPage />} />
                <Route path="/dna/:token" element={<ShareView />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/evolution" element={<Evolution />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function BootScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spinSlow rounded-full border border-white/10 border-t-neon-cyan/80" />
      <p className="muted text-sm">Sequencing your local database…</p>
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spinSlow rounded-full border border-white/10 border-t-neon-cyan/70" />
    </div>
  );
}

/** Fixed, cheap ambient background. Pure CSS so it costs nothing on mobile. */
function AmbientBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-[20%] -top-[18%] h-[46vh] w-[46vh] rounded-full bg-neon-violet/12 blur-[110px] animate-drift" />
      <div className="absolute -right-[16%] top-[22%] h-[40vh] w-[40vh] rounded-full bg-neon-cyan/10 blur-[120px] animate-drift" />
      <div className="absolute bottom-[-22%] left-[26%] h-[42vh] w-[42vh] rounded-full bg-neon-blue/8 blur-[130px]" />
      <div className="absolute inset-0 grain opacity-[0.35]" />
    </div>
  );
}
