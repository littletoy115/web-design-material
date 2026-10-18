import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../cn';
import { baseLayers3d, fabricById, formatPrice, productById, products, type Category, type Product, type Slot } from '../data';
import ProductImage from '../components/ProductImage';
import { builds, genders, skinTones, type Build, type Gender } from '../three/body';
import type { FitItem } from '../three/fitItem';
import type { CameraView } from '../three/Fitting3D';
import { usePageTitle } from '../usePageTitle';

// three.js is large; only download it when someone opens the fitting room.
const Fitting3D = lazy(() => import('../three/Fitting3D'));

type Outfit = Partial<Record<Slot, string>>;

// The realistic MakeHuman models are built (tools/fitting-room); only pieces with a fitted 3D model are listed then.
const REALISTIC = products.some((p) => p.model);
const available = (p: Product) => !REALISTIC || !!p.model;

/** Category rail, in the order an outfit is put together. Icons are 24px stroke paths. */
const RAIL: { slot: Slot; label: string; title: string; icon: string; note?: string }[] = [
  { slot: 'top', label: 'Tops', title: 'Tops', icon: 'M8 4l4 2 4-2 4 3-2 4-2-1v10H8V10l-2 1-2-4z' },
  { slot: 'outer', label: 'Outer', title: 'Outerwear', icon: 'M8 4l4 3 4-3 4 3v13h-4v-8h-1v8H9v-8H8v8H4V7z' },
  { slot: 'bottom', label: 'Bottoms', title: 'Pants & skirts', icon: 'M7 3h10l1 18h-4l-2-11-2 11H6z' },
  { slot: 'dress', label: 'Dresses', title: 'Dresses & sets', icon: 'M9 3h6l-1 5 4 13H6l4-13z', note: 'a dress replaces the top and bottom' },
  { slot: 'shoes', label: 'Shoes', title: 'Shoes', icon: 'M3 16c2 0 4-1 5-4l3 1c2 1 6 1 8 2s2 3 2 4H3z' },
  { slot: 'hat', label: 'Hats', title: 'Hats', icon: 'M4 16c0-2 4-3 8-3s8 1 8 3M7 13c0-4 2-7 5-7s5 3 5 7' },
];

// Order of the pieces in the look summary, top to toe.
const LOOK_ORDER: Slot[] = ['hat', 'outer', 'top', 'dress', 'bottom', 'shoes'];
const LETTER_SIZES = ['S', 'M', 'L', 'XL'];
const SAVED_KEY = 'homfaai.look';

function wear(outfit: Outfit, product: Product): Outfit {
  const slot = product.slot;
  if (outfit[slot] === product.id) {
    const next = { ...outfit };
    delete next[slot];
    return next;
  }
  const next = { ...outfit, [slot]: product.id };
  // A dress replaces top and bottom; a top or bottom replaces a dress.
  if (slot === 'dress') {
    delete next.top;
    delete next.bottom;
  } else if (slot === 'top' || slot === 'bottom') {
    delete next.dress;
  }
  return next;
}

function savedOutfit(): Outfit | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Outfit;
    // drop pieces that no longer exist
    return Object.fromEntries(Object.entries(o).filter(([, id]) => products.some((p) => p.id === id))) as Outfit;
  } catch {
    return null;
  }
}

function initialOutfit(itemId: string | null): Outfit {
  const base: Outfit = savedOutfit() ?? { top: 'p09', bottom: 'p04', shoes: 'p22' };
  // ?item=p09 or a whole look: ?item=s-polo,s-trouser
  const items = (itemId ?? '').split(',').flatMap((id) => products.filter((p) => p.id === id));
  return items.reduce(wear, base);
}

function sizeNote(p: Product, suggested: string) {
  if (!p.sizes.every((s) => LETTER_SIZES.includes(s))) {
    return { ok: true, text: p.sizes.length === 1 ? p.sizes[0] : `Sizes ${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` };
  }
  return p.sizes.includes(suggested)
    ? { ok: true, text: `${suggested} available` }
    : { ok: false, text: `No ${suggested} (has ${p.sizes.join(' / ')})` };
}

const pillBase = 'min-h-[34px] rounded-full px-3.5 text-[13px] transition-colors';

/** Small menu that opens from a pill on the stage. */
function StagePopover({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className="absolute left-1/2 top-[calc(100%+8px)] z-10 flex -translate-x-1/2 gap-2 rounded-full border border-ink/10 bg-white p-1.5 shadow-md"
    >
      {children}
    </div>
  );
}

/** Attribution for the third-party 3D assets (required by CC-BY). */
function ModelCredits() {
  const byLicense = new Map<string, Set<string>>();
  for (const p of products) {
    if (!p.credit) continue;
    const lic = p.credit.license || 'CC0';
    if (!byLicense.has(lic)) byLicense.set(lic, new Set());
    if (p.credit.author) byLicense.get(lic)!.add(p.credit.author);
  }
  return (
    <section aria-labelledby="credits-heading" className="border-t border-faded/50 pt-5 text-xs text-ink/55">
      <h2 id="credits-heading" className="font-medium text-ink/70">
        3D model credits
      </h2>
      <p className="mt-1.5 text-pretty">
        Mannequins and sample garments are built with{' '}
        <a href="https://static.makehumancommunity.org/" target="_blank" rel="noreferrer" className="text-hom hover:underline">
          MakeHuman
        </a>{' '}
        and the{' '}
        <a href="https://static.makehumancommunity.org/assets/assetpacks/index.html" target="_blank" rel="noreferrer" className="text-hom hover:underline">
          MakeHuman community asset packs
        </a>
        .{' '}
        {[...byLicense].map(([lic, authors]) => (
          <span key={lic}>
            {lic}: {authors.size ? [...authors].sort().join(', ') : 'MakeHuman team'}.{' '}
          </span>
        ))}
      </p>
    </section>
  );
}

export default function FittingPage() {
  usePageTitle('Fitting room');
  const [params] = useSearchParams();
  const [gender, setGender] = useState<Gender>(params.get('gender') === 'male' ? 'male' : 'female');
  const [skin, setSkin] = useState(skinTones[1].color);
  const [build, setBuild] = useState<Build>('regular');
  const [outfit, setOutfit] = useState<Outfit>(() => initialOutfit(params.get('item')));
  const [slot, setSlot] = useState<Slot>(() => {
    const item = products.find((p) => p.id === params.get('item')?.split(',')[0]);
    return item?.slot ?? 'top';
  });
  const [filter, setFilter] = useState<string>('all');
  const [menu, setMenu] = useState<'skin' | 'build' | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [view, setView] = useState<{ id: CameraView; nonce: number }>(() => {
    const v = params.get('view');
    return { id: v === 'top' || v === 'shoes' ? v : 'full', nonce: 0 };
  });
  const [saved, setSaved] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ back: false, more: false });

  const worn = LOOK_ORDER.filter((s) => outfit[s]).map((s) => productById(outfit[s]!));
  const items: FitItem[] = worn.map((p) => {
    const f = p.fabricId ? fabricById(p.fabricId) : undefined;
    return { id: p.id, name: p.name, slot: p.slot, model: p.model, tucked: p.tucked, garment: p.garment, fabric: f && { weave: f.weave, colors: f.colors } };
  });
  const total = worn.reduce((sum, p) => sum + p.price, 0);
  const suggestedSize = builds.find((b) => b.id === build)!.size;
  const label = worn.length ? `Mannequin wearing ${worn.map((p) => p.name).join(', ')}` : 'Mannequin with no pieces from the shop';

  const rail = RAIL.find((r) => r.slot === slot)!;
  const inSlot = products.filter((p) => p.slot === slot && available(p));
  // Sub-types when the slot mixes categories (dresses and sets, pants and skirts); otherwise our cloth vs 3D samples.
  const kinds = [...new Set(inSlot.map((p) => p.category))];
  const filters: { id: string; label: string; keep: (p: Product) => boolean }[] =
    kinds.length > 1
      ? kinds.map((k: Category) => ({ id: k, label: k, keep: (p) => p.category === k }))
      : [
          { id: 'homfaai', label: 'Homfaai cloth', keep: (p: Product) => !p.sample },
          { id: 'samples', label: '3D samples', keep: (p: Product) => !!p.sample },
        ].filter((f) => inSlot.some(f.keep));
  const active = filters.find((f) => f.id === filter);
  const shown = active ? inSlot.filter(active.keep) : inSlot;

  // Start downloading the mannequin and the worn pieces now, alongside the 3D viewer's code,
  // instead of after it has loaded. Same request mode as three's loader, so the browser reuses it.
  const modelKey = [gender, ...items.map((i) => i.model ?? '')].join(',');
  useEffect(() => {
    if (!REALISTIC) return;
    const files = ['body', baseLayers3d.top, baseLayers3d.bottom, ...items.map((i) => i.model)];
    for (const f of files) {
      if (!f) continue;
      const href = `/models/${gender}/${f}.glb`;
      if (document.head.querySelector(`link[href="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [modelKey]);

  const updateScroll = () => {
    const el = track.current;
    if (!el) return;
    setCanScroll({ back: el.scrollLeft > 4, more: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
    updateScroll();
  }, [slot, filter]);
  useEffect(() => {
    window.addEventListener('resize', updateScroll);
    return () => window.removeEventListener('resize', updateScroll);
  }, []);
  const scrollBy = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 160 * 3, behavior: 'smooth' });

  function chooseSlot(s: Slot) {
    setSlot(s);
    setFilter('all');
  }

  function saveLook() {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(outfit));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }
  useEffect(() => setSaved(false), [outfit]);

  const shopMessage = `I'd like to buy this look from the fitting room:\n${worn
    .map((p) => `- ${p.name} (${formatPrice(p.price)})`)
    .join('\n')}\nSize: ${suggestedSize}`;

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-5 sm:px-6 lg:px-10">
      <h1 className="sr-only">Fitting room</h1>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Category rail */}
        <nav aria-label="Categories" className="flex gap-1.5 overflow-x-auto lg:w-[88px] lg:flex-none lg:flex-col lg:overflow-visible">
          {RAIL.map((r) => {
            const selected = r.slot === slot;
            return (
              <button
                key={r.slot}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseSlot(r.slot)}
                className={cn(
                  'relative flex min-h-[76px] min-w-[76px] flex-col items-center justify-center gap-1.5 rounded-md border text-xs leading-tight transition-colors',
                  selected ? 'border-hom bg-[#E3E9F3] text-hom' : 'border-transparent text-ink/70 hover:bg-white'
                )}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={r.icon} />
                </svg>
                {r.label}
                {outfit[r.slot] && <span className="absolute right-2.5 top-2 size-2 rounded-full bg-thread" aria-label="wearing one" />}
              </button>
            );
          })}
        </nav>

        {/* Stage and carousel */}
        {/* minmax(0,1fr) keeps the long carousel from widening the column */}
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3.5">
          <section
            aria-label="Mannequin"
            className="relative h-[440px] overflow-hidden rounded-md sm:h-[500px]"
            style={{ background: 'linear-gradient(180deg, #F4F4F2 0%, #E9E9E6 100%)' }}
          >
            <Suspense fallback={<div className="flex size-full items-center justify-center text-sm text-ink/55">Loading 3D model</div>}>
              <Fitting3D
                gender={gender}
                skin={skin}
                build={build}
                items={items}
                label={label}
                realistic={REALISTIC}
                baseLayers={baseLayers3d}
                autoRotate={autoRotate}
                view={view.id}
                viewNonce={view.nonce}
              />
            </Suspense>

            {/* Mannequin settings */}
            <div className="absolute left-1/2 top-3.5 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-ink/[0.08] bg-white/90 p-[5px]">
              {genders.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={gender === g.id}
                  onClick={() => setGender(g.id)}
                  className={cn(pillBase, gender === g.id ? 'bg-ink text-cotton' : 'text-ink hover:bg-ink/5')}
                >
                  {g.label}
                </button>
              ))}
              <span aria-hidden className="h-5 w-px bg-ink/15" />
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={menu === 'skin'}
                  onClick={() => setMenu((m) => (m === 'skin' ? null : 'skin'))}
                  className={cn(pillBase, 'flex items-center gap-1.5 text-ink hover:bg-ink/5')}
                >
                  <span className="size-4 rounded-full" style={{ backgroundColor: skin }} />
                  Skin
                </button>
                <StagePopover open={menu === 'skin'} onClose={() => setMenu(null)} label="Skin tone">
                  {skinTones.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={t.label}
                      aria-pressed={skin === t.color}
                      onClick={() => {
                        setSkin(t.color);
                        setMenu(null);
                      }}
                      className={cn('size-9 rounded-full border-2 border-white', skin === t.color ? 'ring-2 ring-hom' : 'ring-1 ring-ink/15')}
                      style={{ backgroundColor: t.color }}
                    />
                  ))}
                </StagePopover>
              </div>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={menu === 'build'}
                  onClick={() => setMenu((m) => (m === 'build' ? null : 'build'))}
                  className={cn(pillBase, 'whitespace-nowrap text-ink hover:bg-ink/5')}
                >
                  Build · {suggestedSize}
                </button>
                <StagePopover open={menu === 'build'} onClose={() => setMenu(null)} label="Build">
                  {builds.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={build === b.id}
                      onClick={() => {
                        setBuild(b.id);
                        setMenu(null);
                      }}
                      className={cn(pillBase, 'whitespace-nowrap', build === b.id ? 'bg-ink text-cotton' : 'text-ink hover:bg-ink/5')}
                    >
                      {b.label} · {b.size}
                    </button>
                  ))}
                </StagePopover>
              </div>
            </div>

            {/* Quick camera views; drag, right-drag and scroll still move freely */}
            <div role="group" aria-label="Camera view" className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-ink/[0.08] bg-white/90 p-1">
              {(
                [
                  ['full', 'Full'],
                  ['top', 'Top'],
                  ['shoes', 'Shoes'],
                ] as [CameraView, string][]
              ).map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={view.id === id}
                  onClick={() => setView((v) => ({ id, nonce: v.nonce + 1 }))}
                  className={cn(
                    'min-h-9 rounded-full px-3.5 text-xs transition-colors',
                    view.id === id ? 'bg-ink text-cotton' : 'text-ink hover:bg-ink/5'
                  )}
                >
                  {text}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label={autoRotate ? 'Stop rotating' : 'Auto-rotate'}
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate((a) => !a)}
              className={cn(
                'absolute bottom-4 right-4 grid size-11 place-items-center rounded-full border border-ink/10 transition-colors',
                autoRotate ? 'bg-ink text-cotton' : 'bg-white/90 text-ink hover:bg-white'
              )}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 4v5h-5" />
              </svg>
            </button>
          </section>

          <section aria-labelledby="carousel-heading" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <h2 id="carousel-heading" className="font-display text-lg font-semibold">
                  {rail.title}
                </h2>
                <span className="text-[13px] text-ink/55">
                  {inSlot.length} pieces{rail.note && ` · ${rail.note}`}
                </span>
              </div>
              {filters.length > 0 && (
                <div className="flex gap-1.5">
                  {[{ id: 'all', label: 'All' }, ...filters].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={filter === f.id}
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        'min-h-[34px] rounded-full border px-3 text-xs transition-colors',
                        filter === f.id ? 'border-ink bg-ink text-cotton' : 'border-ink/20 bg-white hover:border-ink/50'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <div ref={track} onScroll={updateScroll} className="flex gap-3 overflow-x-auto scroll-smooth pb-1">
                {shown.map((p) => {
                  const on = outfit[slot] === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${on ? 'Take off' : 'Wear'} ${p.name}, ${formatPrice(p.price)}`}
                      onClick={() => setOutfit((o) => wear(o, p))}
                      className={cn(
                        'w-[148px] flex-none rounded border bg-white p-2 text-left transition-colors',
                        on ? 'border-hom ring-1 ring-hom' : 'border-ink/10 hover:border-ink/40'
                      )}
                    >
                      <span className="block aspect-square overflow-hidden rounded-sm bg-[#F6F6F4]">
                        <ProductImage product={p} label="" className="size-full p-1" />
                      </span>
                      <span className="mt-1.5 block truncate text-[13px]">{p.name}</span>
                      <span className="block text-xs tabular-nums text-ink/55">{formatPrice(p.price)}</span>
                    </button>
                  );
                })}
              </div>
              {canScroll.back && (
                <button
                  type="button"
                  aria-label={`Previous ${rail.title.toLowerCase()}`}
                  onClick={() => scrollBy(-1)}
                  className="absolute -left-1.5 top-[50px] grid size-11 place-items-center rounded-full border border-ink/10 bg-white text-ink shadow-md"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
              )}
              {canScroll.more && (
                <button
                  type="button"
                  aria-label={`More ${rail.title.toLowerCase()}`}
                  onClick={() => scrollBy(1)}
                  className="absolute -right-1.5 top-[50px] grid size-11 place-items-center rounded-full border border-ink/10 bg-white text-ink shadow-md"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Look summary */}
        <aside aria-labelledby="look-heading" className="flex w-full min-w-0 flex-col gap-3.5 self-start rounded-md bg-white p-[18px] lg:w-[280px] lg:flex-none">
          <h2 id="look-heading" className="font-display text-lg font-semibold">
            Your look
          </h2>
          {worn.length > 0 ? (
            <ul className="grid gap-2.5">
              {worn.map((p) => {
                const note = sizeNote(p, suggestedSize);
                return (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <span className="size-[52px] flex-none overflow-hidden rounded-sm bg-[#F6F6F4]">
                      <ProductImage product={p} label="" className="size-full p-0.5" />
                    </span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-[13px]">{p.name}</span>
                      <span className={cn('text-xs', note.ok ? 'text-ink/55' : 'text-red-700')}>{note.text}</span>
                    </span>
                    <span className="text-[13px] tabular-nums">{formatPrice(p.price)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-pretty text-sm text-ink/60">Pick a piece below the mannequin to start a look.</p>
          )}
          <div className="flex items-baseline justify-between border-t border-faded/50 pt-3">
            <span className="text-[13px] text-ink/60">
              {worn.length} {worn.length === 1 ? 'piece' : 'pieces'}
            </span>
            <span className="font-display text-[22px] font-semibold tabular-nums">{formatPrice(total)}</span>
          </div>
          {worn.length > 0 ? (
            <Link
              to={`/contact?message=${encodeURIComponent(shopMessage)}`}
              className="flex min-h-11 items-center justify-center rounded-sm bg-hom font-medium text-cotton transition-colors hover:bg-hom-dark"
            >
              Shop this look
            </Link>
          ) : (
            <span aria-disabled className="flex min-h-11 items-center justify-center rounded-sm bg-hom/40 font-medium text-cotton">
              Shop this look
            </span>
          )}
          <button
            type="button"
            onClick={saveLook}
            disabled={worn.length === 0}
            className="min-h-10 rounded-sm border border-ink/20 bg-white text-sm text-ink transition-colors hover:border-ink/50 disabled:opacity-40"
          >
            {saved ? 'Look saved' : 'Save look'}
          </button>
          <p role="status" className="sr-only">
            {saved ? 'Look saved. It will be here next time you open the fitting room.' : ''}
          </p>
        </aside>
      </div>

      <div className="mt-10">{REALISTIC && <ModelCredits />}</div>
    </div>
  );
}
