import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../cn';
import { lineUrl, store } from '../data';
import { pageLoaders, prefetchPage } from '../routes';

const nav = [
  { to: '/', label: 'Home', end: true },
  { to: '/collection', label: 'Collection', end: false },
  { to: '/fitting', label: 'Fitting room', end: false },
  { to: '/stories', label: 'Fabric stories', end: false },
  { to: '/reviews', label: 'Reviews', end: false },
  { to: '/contact', label: 'Contact', end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex min-h-11 items-center px-3 text-[15px] transition-colors',
    isActive ? 'text-hom underline decoration-2 underline-offset-8' : 'text-ink/70 hover:text-ink'
  );

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // Each route is a new page: start at the top like a normal page load,
  // unless the link points at a section (the page scrolls to it itself).
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  // Once the first page is up and the browser is idle, fetch the other pages' code (it is small;
  // the 3D viewer is a separate chunk loaded only by the fitting room).
  useEffect(() => {
    const prefetchAll = () => Object.keys(pageLoaders).forEach(prefetchPage);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(prefetchAll, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-cotton"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-faded/40 bg-cotton pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex min-h-11 items-center gap-2" onClick={() => setMenuOpen(false)}>
            <span className="font-display text-xl font-semibold text-ink">{store.name}</span>
          </Link>

          <nav aria-label="Main menu" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={linkClass}
                    onMouseEnter={() => prefetchPage(item.to)}
                    onFocus={() => prefetchPage(item.to)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label="Main menu" className="border-t border-faded/40 md:hidden">
            <ul className="mx-auto max-w-6xl px-2 py-2">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn('flex min-h-12 items-center px-2 text-base', isActive ? 'font-medium text-hom' : 'text-ink')
                    }
                    onClick={() => setMenuOpen(false)}
                    onTouchStart={() => prefetchPage(item.to)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        {/* pages other than home are separate chunks; keep the header and footer while one loads */}
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="mt-24 bg-ink pb-[env(safe-area-inset-bottom)] text-cotton">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold">{store.name}</p>
            <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-cotton/70">
              Clothes cut from cloth handwoven by weaving groups in northern and northeastern Thailand. We tell you where every piece comes from.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Contact</p>
            <ul className="mt-3 space-y-1 text-sm text-cotton/70">
              <li>
                <a href={`mailto:${store.email}`} className="hover:text-cotton">
                  {store.email}
                </a>
              </li>
              <li>
                <a href={lineUrl(store.line)} target="_blank" rel="noreferrer" className="hover:text-cotton">
                  LINE {store.line}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cotton/15">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-cotton/50 sm:px-6">© 2026 {store.name}</p>
        </div>
      </footer>
    </div>
  );
}
