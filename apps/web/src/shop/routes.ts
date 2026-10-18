// Page chunks, loaded on first visit. The nav calls these on hover/focus so the
// code is usually there before the click.
export const pageLoaders = {
  '/collection': () => import('./pages/CollectionPage'),
  '/fitting': () => import('./pages/FittingPage'),
  '/stories': () => import('./pages/StoriesPage'),
  '/reviews': () => import('./pages/ReviewsPage'),
  '/contact': () => import('./pages/ContactPage'),
};

/** Start downloading a page's code (no-op for the home page, which is in the main bundle). */
export function prefetchPage(path: string) {
  const load = pageLoaders[path.split('?')[0] as keyof typeof pageLoaders];
  load?.().catch(() => undefined);
}
