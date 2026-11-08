import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-[11px] tracking-[0.28em] text-neon-cyan/60">404 · NO SEQUENCE FOUND</p>
      <h1 className="h2 text-white/90">This strand doesn&apos;t exist</h1>
      <p className="max-w-sm text-[13px] leading-relaxed text-white/40">
        The route you opened is not part of this app. Nothing was deleted.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to the lab
      </Link>
    </div>
  );
}
