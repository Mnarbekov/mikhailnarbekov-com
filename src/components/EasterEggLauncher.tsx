import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SpaceInvadersGame = lazy(() => import('../features/easter-egg/SpaceInvadersGame'));

export default function EasterEggLauncher() {
  const [open, setOpen] = useState(false);
  const [playAnyway, setPlayAnyway] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => panelRef.current?.focus(), 30);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const closePanel = () => {
    setOpen(false);
    setPlayAnyway(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const overlay = (
    <section className="egg-overlay" aria-label="Hidden Space Invaders game">
      <div className="egg-panel" ref={panelRef} tabIndex={-1}>
        <div className="egg-head">
          <div>
            <p className="meta">Secret signal</p>
            <h2>Arctic Invaders</h2>
          </div>
          <button className="egg-close" type="button" onClick={closePanel}>Close</button>
        </div>

        {reducedMotion && !playAnyway ? (
          <div className="reduced-card" role="status">
            <p className="eyebrow">Secret found</p>
            <h3>A quiet arcade signal is waiting.</h3>
            <p>Your system requests reduced motion, so the game stays still until you choose to start it.</p>
            <button type="button" onClick={() => setPlayAnyway(true)}>Play anyway</button>
          </div>
        ) : (
          <Suspense fallback={<div className="loading-card">Warming the signal…</div>}>
            <SpaceInvadersGame onExit={closePanel} />
          </Suspense>
        )}
      </div>
    </section>
  );

  return (
    <>
      <button
        ref={triggerRef}
        className="alien-trigger"
        type="button"
        aria-label="Open hidden game"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg className="alien-pixels" viewBox="0 0 28 20" aria-hidden="true" focusable="false">
          <path d="M8 0h4v4H8zM16 0h4v4h-4zM4 4h4v4H4zM8 4h12v4H8zM20 4h4v4h-4zM0 8h28v4H0zM0 12h4v4H0zM8 12h4v4H8zM16 12h4v4h-4zM24 12h4v4h-4zM4 16h4v4H4zM20 16h4v4h-4z" fill="currentColor" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' ? createPortal(overlay, document.body) : null}

      <style>{`
        .alien-trigger { position: relative; justify-self: end; width: 34px; height: 34px; display: grid; place-items: center; overflow: hidden; border: 0; border-radius: 0; background: transparent; color: var(--muted); cursor: pointer; transition: color .2s ease, filter .2s ease, transform .2s ease; }
        .alien-trigger::before { content: ""; position: absolute; inset: 3px; z-index: 2; border-radius: 12px; background: linear-gradient(105deg, transparent 26%, rgba(159,203,255,.1) 40%, rgba(255,255,255,.78) 50%, rgba(159,203,255,.16) 60%, transparent 74%); opacity: 0; transform: translateX(-140%); animation: alienShimmer 7s ease-in-out infinite; pointer-events: none; mix-blend-mode: screen; }
        .alien-trigger::after { content: ""; position: absolute; inset: 6px 4px; border-radius: 12px; background: radial-gradient(circle, rgba(159,203,255,.5), transparent 62%); opacity: 0; filter: blur(8px); animation: alienPulse 7s ease-in-out infinite; pointer-events: none; }
        .alien-trigger:hover, .alien-trigger[aria-expanded="true"] { color: var(--accent); filter: drop-shadow(0 0 12px rgba(159,203,255,.28)); transform: translateY(-1px); }
        .alien-pixels { position: relative; z-index: 1; width: 18px; height: 14px; opacity: .88; filter: drop-shadow(0 0 6px rgba(159,203,255,.08)); animation: alienSheen 7s ease-in-out infinite; }
        .alien-trigger:hover .alien-pixels, .alien-trigger[aria-expanded="true"] .alien-pixels { opacity: 1; filter: drop-shadow(0 0 8px rgba(159,203,255,.28)); }
        @keyframes alienPulse { 0%, 58%, 100% { opacity: 0; transform: scale(.84); } 64% { opacity: .72; transform: scale(1.05); } 72% { opacity: .16; transform: scale(1.28); } }
        @keyframes alienShimmer { 0%, 56%, 100% { opacity: 0; transform: translateX(-140%); } 64% { opacity: .78; } 72% { opacity: 0; transform: translateX(140%); } }
        @keyframes alienSheen { 0%, 56%, 100% { color: var(--muted); filter: drop-shadow(0 0 6px rgba(159,203,255,.08)); } 68% { color: var(--accent); filter: drop-shadow(0 0 12px rgba(159,203,255,.38)); } }
        .egg-overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: start center; overflow-y: auto; padding: clamp(84px, 9vh, 112px) 18px 28px; background: radial-gradient(circle at 50% 18%, rgba(159,203,255,.16), transparent 34%), rgba(5,8,12,.62); backdrop-filter: blur(18px); }
        :root[data-theme="light"] .egg-overlay { background: radial-gradient(circle at 50% 18%, rgba(47,117,184,.16), transparent 34%), rgba(247,249,251,.72); }
        .egg-panel { width: min(980px, 100%); border: 1px solid var(--accent-line); border-radius: 28px; padding: clamp(18px, 3vw, 28px); background: linear-gradient(145deg, rgba(12,17,25,.96), rgba(15,24,36,.94)); color: var(--text); box-shadow: 0 24px 80px rgba(0,0,0,.42), 0 0 48px rgba(159,203,255,.13); }
        :root[data-theme="light"] .egg-panel { background: linear-gradient(145deg, rgba(255,255,255,.96), rgba(238,244,248,.94)); color: var(--text); box-shadow: 0 24px 70px rgba(35,49,66,.22), 0 0 36px rgba(47,117,184,.12); }
        .egg-panel:focus { outline: none; }
        .egg-head { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 18px; border-bottom: 1px solid var(--rule); padding-bottom: 16px; }
        .egg-head h2 { margin: 4px 0 0; color: var(--title); font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 400; line-height: 1; letter-spacing: -.055em; }
        .egg-close, .reduced-card button { border: 1px solid var(--accent-line); border-radius: 999px; padding: 10px 14px; background: rgba(159,203,255,.08); color: var(--title); cursor: pointer; font: 700 .72rem/1 var(--font-body); letter-spacing: .12em; text-transform: uppercase; }
        .reduced-card, .loading-card { min-height: 310px; display: grid; align-content: center; gap: 14px; border: 1px solid var(--hairline); border-radius: 22px; padding: clamp(22px, 5vw, 42px); background: rgba(159,203,255,.055); color: var(--text-soft); }
        .reduced-card h3 { margin: 0; color: var(--title); font-family: var(--font-display); font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 400; letter-spacing: -.04em; }
        .reduced-card p { max-width: 620px; margin: 0; }
        .reduced-card button { width: fit-content; margin-top: 8px; }
        @media (max-width: 760px) { .alien-trigger { width: 32px; height: 32px; } .egg-head { align-items: stretch; flex-direction: column; } .egg-close { width: fit-content; } }
        @media (prefers-reduced-motion: reduce) { .alien-trigger { transition: none; } .alien-trigger::before, .alien-trigger::after, .alien-pixels { animation: none; } .alien-trigger:hover { transform: none; } }
      `}</style>
    </>
  );
}
