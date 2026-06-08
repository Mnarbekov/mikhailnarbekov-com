import { useEffect, useState } from 'react';

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('b032-theme') as 'dark' | 'light' | null;
    const next = stored || 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('b032-theme', next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <button className="theme-switch" type="button" onClick={toggle} aria-pressed={theme === 'light'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span><i aria-hidden="true" />
      <style>{`.theme-switch { justify-self: end; width: max-content; display: inline-flex; align-items: center; gap: 10px; border: 1px solid var(--card-border); border-radius: 999px; padding: 6px 7px 6px 12px; background: var(--card-bg); color: var(--text-soft); cursor: pointer; font: 700 .68rem/1 var(--font-body); letter-spacing: .14em; text-transform: uppercase; } .theme-switch i { position: relative; flex: 0 0 auto; width: 36px; height: 20px; border: 1px solid var(--hairline); border-radius: 999px; background: rgba(159,203,255,.12); } .theme-switch i::after { content: ""; position: absolute; top: 3px; left: ${theme === 'dark' ? '3px' : '17px'}; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); transition: left .18s ease; } @media (max-width: 760px) { .theme-switch { gap: 0; padding: 5px 6px; font-size: .6rem; letter-spacing: .08em; } .theme-switch span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; } .theme-switch i { width: 28px; height: 18px; } .theme-switch i::after { top: 3px; left: ${theme === 'dark' ? '3px' : '13px'}; width: 10px; height: 10px; } }`}</style>
    </button>
  );
}
