import { useEffect, useMemo, useRef, useState } from 'react';

type Project = {
  title: string;
  status: string;
  problem: string;
  role: string;
  result: string;
  tags: string[];
  github?: string;
  medium?: string;
  diagram?: string;
  screenshot?: string;
};

const projects: Project[] = [
  {
    title: 'YouTube Digest',
    status: 'Published showcase',
    problem: 'Too many new videos, limited attention, and useful ideas buried inside long transcripts.',
    role: 'Misha defined the household use case, guided discovery and transcript handling, shaped the summary and email output, and set the privacy boundary.',
    result: 'A weekly AI-assisted digest that helps a household choose which long-form YouTube episodes are worth watching.',
    tags: ['Published', 'GitHub', 'Content workflow'],
    github: 'https://github.com/Mnarbekov/ai-youtube-digest',
    medium: 'https://medium.com/@mikhail.narbekov/proving-ais-value-to-my-wife-i-built-a-weekly-youtube-digest-d3a797b9f69b',
    screenshot: '/projects/screenshots/youtube-digest-email.png',
    diagram: '/projects/diagrams/youtube-digest-flow.png',
  },
  {
    title: 'Cadence',
    status: 'Published showcase',
    problem: 'Gyms did not fit the routine; the useful system needed to show the plan, capture the session, and carry context forward.',
    role: 'Misha designed the phone-based training loop and the public-safe explanation of an AI sport and health coach workflow.',
    result: 'A working private app; the public showcase uses demo data and sanitized screenshots.',
    tags: ['Published', 'GitHub', 'Demo data'],
    github: 'https://github.com/Mnarbekov/cadence-app',
    medium: 'https://medium.com/@mikhail.narbekov/i-used-ai-to-build-a-training-app-i-would-actually-use-30df337b2d9d',
    screenshot: '/projects/screenshots/cadence-phone-session.png',
    diagram: '/projects/diagrams/cadence-loop.png',
  },
  {
    title: 'Journal',
    status: 'Published showcase',
    problem: 'Paper was not always nearby, and Apple Notes became capture-and-forget rather than capture-and-return.',
    role: 'Misha shaped a private-first mobile capture flow and a bridge into laptop-based reflection.',
    result: 'A working private journal system; public case note can show structure without private entries.',
    tags: ['Published', 'Private-first', 'GitHub'],
    github: 'https://github.com/Mnarbekov/journal',
    medium: 'https://medium.com/@mikhail.narbekov/i-built-a-journaling-app-because-i-kept-losing-my-own-thinking-e86cfc0177d2',
    screenshot: '/projects/screenshots/journal-phone-capture.png',
    diagram: '/projects/diagrams/journal-bridge.png',
  },
  {
    title: 'My Life',
    status: 'GitHub showcase',
    problem: 'Personal records had value, but not enough usable context in one calm, searchable place.',
    role: 'Misha directed the local-first product shape across journals, ideas, schedules, books, people, meetings, and long-horizon context.',
    result: 'A working private laptop hub; the public showcase explains the model with safe examples.',
    tags: ['Local-first', 'Personal knowledge', 'GitHub'],
    github: 'https://github.com/Mnarbekov/my-life-laptop-app',
    medium: 'https://medium.com/@mikhail.narbekov/i-had-a-lot-of-useful-data-but-no-place-to-use-it-so-i-built-one-bbb570df9029',
    screenshot: '/projects/screenshots/my-life-laptop-hub.png',
    diagram: '/projects/diagrams/my-life-hub.png',
  },
  {
    title: 'Family Briefing',
    status: 'GitHub showcase',
    problem: 'Household logistics are easy to miss when reminders, events, preparation needs, and weather checks live in different places.',
    role: 'Misha specified the morning briefing behaviour, concise output style, automation boundary, and safe public packaging.',
    result: 'A working private automation that delivers a short family briefing without exposing private calendar or message data.',
    tags: ['Automation', 'Private boundary', 'GitHub'],
    github: 'https://github.com/Mnarbekov/family-briefing-n8n',
    medium: 'https://medium.com/@mikhail.narbekov/meet-mrs-maggie-the-ai-assistant-who-briefs-my-family-every-morning-5a590e3e0a00',
    screenshot: '/projects/screenshots/family-briefing-telegram.png',
    diagram: '/projects/diagrams/family-briefing-flow.png',
  },
];

export default function ProjectCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = projects[selectedIndex];
  const safeId = useMemo(() => selected.title.toLowerCase().replace(/\s+/g, '-'), [selected.title]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => {
      const reachedEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      setAtEnd(reachedEnd);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const moveSelection = (direction: 1 | -1) => {
    setSelectedIndex((current) => (current + direction + projects.length) % projects.length);
  };

  return (
    <div className="project-showcase" aria-label="Project carousel" data-at-end={atEnd ? 'true' : 'false'}>
      <div className="project-list" ref={listRef} aria-label="Select a project">
        {projects.map((project, index) => {
          const selectedProject = index === selectedIndex;
          const projectId = project.title.toLowerCase().replace(/\s+/g, '-');
          return (
            <button
              key={project.title}
              id={`project-option-${projectId}`}
              className="project-option"
              type="button"
              aria-pressed={selectedProject}
              onClick={() => setSelectedIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  moveSelection(1);
                }
                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  moveSelection(-1);
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  setSelectedIndex(0);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  setSelectedIndex(projects.length - 1);
                }
              }}
            >
              <span>{project.title}</span>
              <small>{project.status}</small>
            </button>
          );
        })}
      </div>
      <div className="project-list-edge-cue" aria-hidden="true">›</div>

      <article id={`project-panel-${safeId}`} className="selected-project card" aria-live="polite" aria-labelledby={`project-title-${safeId}`}>
        <div className="stagger-root" key={selectedIndex}>
          <div className="project-card-head">
            <div>
              <p className="meta">{selected.status}</p>
              <h3 id={`project-title-${safeId}`}>{selected.title}</h3>
            </div>
            {selected.github || selected.medium ? (
              <div className="project-links">
                {selected.github && (
                  <a className="github-link" href={selected.github} target="_blank" rel="noreferrer">
                    GitHub <span aria-hidden="true">↗</span>
                  </a>
                )}
                {selected.medium && (
                  <a className="github-link medium-link" href={selected.medium} target="_blank" rel="noreferrer">
                    Medium <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            ) : (
              <span className="github-placeholder">GitHub coming later</span>
            )}
          </div>

          <div className="screenshot-row" aria-label={`${selected.title} visuals`}>
            {selected.diagram ? (
              <button
                type="button"
                className="zoom-target zoom-target-wide"
                onClick={() => setLightbox({ src: selected.diagram!, alt: `${selected.title} flow diagram` })}
                aria-label={`Open ${selected.title} diagram at full size`}
              >
                <img className="project-diagram" src={selected.diagram} alt={`${selected.title} flow diagram`} loading="lazy" />
                <span className="zoom-hint" aria-hidden="true">Click to enlarge</span>
              </button>
            ) : (
              <div className="screenshot-placeholder"><span>Diagram planned</span></div>
            )}
            {selected.screenshot ? (
              <button
                type="button"
                className="zoom-target"
                onClick={() => setLightbox({ src: selected.screenshot!, alt: `${selected.title} screenshot` })}
                aria-label={`Open ${selected.title} screenshot at full size`}
              >
                <img className="project-screenshot" src={selected.screenshot} alt={`${selected.title} screenshot`} loading="lazy" />
                <span className="zoom-hint" aria-hidden="true">Click to enlarge</span>
              </button>
            ) : (
              <div className="screenshot-placeholder compact"><span>Screenshot planned</span></div>
            )}
          </div>

          <div className="project-detail-grid">
            <section>
              <h4>Problem</h4>
              <p>{selected.problem}</p>
            </section>
            <section>
              <h4>Role</h4>
              <p>{selected.role}</p>
            </section>
            <section>
              <h4>Result</h4>
              <p>{selected.result}</p>
            </section>
          </div>

          <div className="tags">
            {selected.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
          </div>
        </div>
      </article>

      {lightbox && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.alt}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="Close enlarged image"
          >
            ×
          </button>
          <img
            className="lightbox-img"
            src={lightbox.src}
            alt={lightbox.alt}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="lightbox-hint" aria-hidden="true">Click outside or press Esc to close</p>
        </div>
      )}

      <style>{`
        .project-showcase { position: relative; display: grid; grid-template-columns: 1fr; gap: 18px; margin-top: 34px; align-items: stretch; }
        .project-list { display: flex; gap: 10px; align-content: start; overflow-x: auto; overscroll-behavior-inline: contain; scroll-snap-type: inline proximity; padding: 2px 0 8px; }
        .project-list::-webkit-scrollbar { height: 8px; }
        .project-list::-webkit-scrollbar-thumb { border-radius: 999px; background: var(--hairline); }
        .project-option { flex: 0 0 clamp(178px, 22vw, 230px); min-height: 86px; text-align: left; border: 1px solid var(--hairline); border-radius: 18px; padding: 15px 16px; background: rgba(226,236,246,.035); color: var(--text-soft); cursor: pointer; scroll-snap-align: start; transition: border-color .2s ease, transform .2s ease, background .2s ease, flex-basis .2s ease; }
        .project-option:hover, .project-option[aria-pressed="true"] { border-color: var(--accent-line); background: rgba(159,203,255,.08); transform: translateY(-1px); }
        .project-option[aria-pressed="true"] { flex-basis: clamp(230px, 30vw, 320px); }
        .project-option span { display: block; color: var(--title); font-family: var(--font-display); font-size: 1.18rem; letter-spacing: -.035em; }
        .project-option small { display: block; margin-top: 5px; color: var(--muted); font-family: var(--font-code); font-size: .66rem; letter-spacing: .12em; text-transform: uppercase; }
        .selected-project { display: grid; gap: 22px; padding: 28px; }
        .selected-project:hover { transform: none; }
        .stagger-root { display: grid; gap: 22px; }
        .stagger-root > .project-card-head    { opacity: 0; animation: stratified-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) 0ms forwards; }
        .stagger-root > .screenshot-row       { opacity: 0; animation: stratified-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) 100ms forwards; }
        .stagger-root > .project-detail-grid  { opacity: 0; animation: stratified-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) 200ms forwards; }
        .stagger-root > .tags                 { opacity: 0; animation: stratified-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) 300ms forwards; }
        @keyframes stratified-fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .stagger-root > * { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
        .project-card-head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; border-bottom: 1px solid var(--rule); padding-bottom: 18px; }
        .project-card-head h3 { margin: 8px 0 0; font-size: clamp(2rem, 4vw, 3rem); }
        .github-link, .github-placeholder { flex: 0 0 auto; border: 1px solid var(--accent-line); border-radius: 999px; padding: 9px 12px; color: var(--title); background: rgba(159,203,255,.07); font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; }
        .github-placeholder { color: var(--muted); border-color: var(--hairline); background: transparent; }
        .project-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; flex: 0 0 auto; }
        .screenshot-row { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; align-items: stretch; }
        .screenshot-placeholder { min-height: 230px; border: 1px dashed var(--accent-line); border-radius: 20px; display: grid; place-items: center; background: linear-gradient(135deg, rgba(159,203,255,.08), rgba(226,236,246,.035)); color: var(--muted); font-family: var(--font-code); font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; }
        .screenshot-placeholder.compact { min-height: 230px; }
        .project-screenshot, .project-diagram { display: block; width: 100%; height: 100%; object-fit: contain; border: 1px solid var(--hairline); border-radius: 20px; background: rgba(11,13,16,.45); }
        .zoom-target { position: relative; display: block; padding: 0; border: 0; background: transparent; cursor: zoom-in; border-radius: 20px; overflow: hidden; transition: transform .2s ease; min-height: 280px; max-height: 380px; }
        .zoom-target-wide { min-height: 280px; max-height: 380px; }
        .zoom-target { position: relative; display: block; padding: 0; border: 0; background: transparent; cursor: zoom-in; border-radius: 20px; overflow: hidden; transition: transform .2s ease; }
        .zoom-target:hover { transform: scale(1.015); }
        .zoom-target:hover .zoom-hint { opacity: 1; }
        .zoom-target:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; }
        .zoom-hint { position: absolute; bottom: 10px; right: 12px; padding: 5px 10px; background: rgba(11,13,16,.78); color: var(--text-soft); font: 700 .62rem/1 var(--font-code); letter-spacing: .12em; text-transform: uppercase; border: 1px solid var(--hairline); border-radius: 999px; backdrop-filter: blur(10px); opacity: 0; transition: opacity .18s ease; pointer-events: none; }
        .lightbox-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: clamp(20px, 4vw, 60px); background: rgba(6,8,11,.86); backdrop-filter: blur(14px); animation: lightbox-fade-in 220ms ease forwards; cursor: zoom-out; }
        @keyframes lightbox-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .lightbox-img { display: block; max-width: 95vw; max-height: 90vh; width: auto; height: auto; object-fit: contain; border: 1px solid var(--accent-line); border-radius: 22px; background: rgba(11,13,16,.6); box-shadow: 0 24px 80px rgba(0,0,0,.5); cursor: default; }
        .lightbox-close { position: fixed; top: 24px; right: 28px; width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border: 1px solid var(--accent-line); border-radius: 50%; background: rgba(11,13,16,.78); color: var(--title); font-size: 1.6rem; line-height: 1; cursor: pointer; backdrop-filter: blur(10px); transition: transform .15s ease, border-color .15s ease; }
        .lightbox-close:hover { transform: scale(1.05); border-color: var(--accent); }
        .lightbox-hint { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); margin: 0; color: var(--muted); font: 700 .68rem/1 var(--font-code); letter-spacing: .14em; text-transform: uppercase; }
        .project-detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .project-detail-grid h4 { margin: 0 0 8px; color: var(--accent); font-size: .7rem; letter-spacing: .15em; text-transform: uppercase; }
        .project-detail-grid p { margin: 0; color: var(--text-soft); }
        @media (min-width: 861px) {
          .project-list { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); overflow: visible; padding-bottom: 0; }
          .project-option, .project-option[aria-pressed="true"] { min-width: 0; flex-basis: auto; }
        }
        .project-list-edge-cue { display: none; }
        @media (max-width: 860px) {
          .screenshot-row, .project-detail-grid { grid-template-columns: 1fr; }
          .project-card-head { flex-direction: column; }
          .github-link, .github-placeholder { width: fit-content; }
          .project-option { flex-basis: min(88vw, 320px); }
          .project-option[aria-pressed="true"] { flex-basis: min(92vw, 340px); }
          .project-list { scroll-padding-inline-end: 14vw; }
          .project-list-edge-cue {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            position: absolute;
            right: 0;
            top: 2px;
            height: 92px;
            width: 64px;
            padding-right: 8px;
            color: var(--accent);
            font-size: 30px;
            line-height: 1;
            background: linear-gradient(to right, transparent, var(--page) 70%);
            pointer-events: none;
            z-index: 2;
            transition: opacity .25s ease;
            animation: pca-nudge-right 1.8s ease-in-out infinite;
          }
          .project-showcase[data-at-end="true"] .project-list-edge-cue {
            opacity: 0;
            animation: none;
          }
          @keyframes pca-nudge-right {
            0%, 100% { transform: translateX(0); opacity: .85; }
            50% { transform: translateX(4px); opacity: 1; }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .project-list-edge-cue { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
