import { lazy, Suspense, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../cn';
import { baseLayers3d, fabricById, formatPrice, productById, products, type Product, type Slot } from '../data';
import ProductImage from '../components/ProductImage';
import { builds, genders, skinTones, type Build, type Gender } from '../three/body';
import type { FitItem } from '../three/fitItem';
import { usePageTitle } from '../usePageTitle';

// three.js is large; only download it when someone opens the fitting room.
const Fitting3D = lazy(() => import('../three/Fitting3D'));

type Outfit = Partial<Record<Slot, string>>;

// The realistic MakeHuman models are built (tools/fitting-room); only pieces with a fitted 3D model are listed then.
const REALISTIC = products.some((p) => p.model);

const sections: { slot: Slot; label: string; note?: string }[] = [
  { slot: 'top', label: 'Tops' },
  { slot: 'outer', label: 'Outerwear' },
  { slot: 'bottom', label: 'Pants & skirts' },
  { slot: 'dress', label: 'Dresses & sets', note: 'A dress or set takes off the top and bottom.' },
  { slot: 'shoes', label: 'Shoes' },
  { slot: 'hat', label: 'Hats' },
];

// Drawing order on the body, inside-out.
const layerOrder: Slot[] = ['shoes', 'bottom', 'top', 'dress', 'outer', 'hat'];
const LETTER_SIZES = ['S', 'M', 'L', 'XL'];

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

function initialOutfit(itemId: string | null): Outfit {
  const item = itemId ? products.find((p) => p.id === itemId) : undefined;
  const base: Outfit = { top: 'p09', bottom: 'p04', shoes: 'p22' };
  return item ? wear(base, item) : base;
}

function Choice({
  active,
  onClick,
  label,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'border transition-colors',
        active ? 'border-hom ring-1 ring-hom' : 'border-ink/15 hover:border-ink/50',
        className
      )}
    >
      {children}
    </button>
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
    <section aria-labelledby="credits-heading" className="border-t border-faded/50 pt-6 text-sm text-ink/60">
      <h2 id="credits-heading" className="font-medium text-ink">
        3D model credits
      </h2>
      <p className="mt-2 text-pretty">
        Mannequins and sample garments are built with{' '}
        <a href="https://static.makehumancommunity.org/" target="_blank" rel="noreferrer" className="text-hom hover:underline">
          MakeHuman
        </a>{' '}
        and assets from the{' '}
        <a href="https://static.makehumancommunity.org/assets/assetpacks/index.html" target="_blank" rel="noreferrer" className="text-hom hover:underline">
          MakeHuman community asset packs
        </a>
        .
      </p>
      <ul className="mt-2 space-y-1">
        {[...byLicense].map(([lic, authors]) => (
          <li key={lic} className="text-pretty">
            <span className="font-medium text-ink/80">{lic}:</span> {authors.size ? [...authors].sort().join(', ') : 'MakeHuman team'}
          </li>
        ))}
      </ul>
    </section>
  );
}

function sizeNote(p: Product, suggested: string) {
  if (!p.sizes.every((s) => LETTER_SIZES.includes(s))) {
    return { ok: true, text: p.sizes.length === 1 ? p.sizes[0] : `Sizes ${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}` };
  }
  return p.sizes.includes(suggested)
    ? { ok: true, text: `${suggested} available` }
    : { ok: false, text: `No ${suggested} (available: ${p.sizes.join(' / ')})` };
}

export default function FittingPage() {
  usePageTitle('Fitting room');
  const [params] = useSearchParams();
  const [gender, setGender] = useState<Gender>(params.get('gender') === 'male' ? 'male' : 'female');
  const [skin, setSkin] = useState(skinTones[1].color);
  const [build, setBuild] = useState<Build>('regular');
  const [outfit, setOutfit] = useState<Outfit>(() => initialOutfit(params.get('item')));

  const worn = layerOrder.filter((s) => outfit[s]).map((s) => productById(outfit[s]!));
  const items: FitItem[] = worn.map((p) => {
    const f = p.fabricId ? fabricById(p.fabricId) : undefined;
    return { id: p.id, name: p.name, slot: p.slot, model: p.model, garment: p.garment, fabric: f && { weave: f.weave, colors: f.colors } };
  });
  const total = worn.reduce((sum, p) => sum + p.price, 0);
  const suggestedSize = builds.find((b) => b.id === build)!.size;
  const label = worn.length ? `Mannequin wearing ${worn.map((p) => p.name).join(', ')}` : 'Mannequin with no pieces from the shop';

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">Fitting room</h1>
      <p className="mt-3 max-w-xl text-pretty text-ink/70">
        Set the mannequin close to your shape, put together clothes, shoes and a hat, then turn it to see every side.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-[5fr_7fr] md:gap-12">
        {/* Stage */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="bg-white px-4 pb-4 pt-4">
            <Suspense
              fallback={
                <div className="flex aspect-[3/4] w-full items-center justify-center text-sm text-ink/55">Loading 3D model</div>
              }
            >
              <Fitting3D gender={gender} skin={skin} build={build} items={items} label={label} realistic={REALISTIC} baseLayers={baseLayers3d} />
            </Suspense>
          </div>

          <div className="mt-4 border-t border-faded/50 pt-4">
            {worn.length > 0 ? (
              <>
                <ul className="space-y-2 text-sm">
                  {worn.map((p) => {
                    const note = sizeNote(p, suggestedSize);
                    return (
                      <li key={p.id} className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate">{p.name}</span>
                          <span className={cn('text-xs', note.ok ? 'text-ink/55' : 'text-red-700')}>{note.text}</span>
                        </span>
                        <span className="shrink-0 tabular-nums">{formatPrice(p.price)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t border-faded/50 pt-3">
                  <span className="text-sm text-ink/60">{worn.length} {worn.length === 1 ? 'piece' : 'pieces'}</span>
                  <span className="font-display text-xl font-semibold tabular-nums">{formatPrice(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOutfit({})}
                  className="mt-2 inline-flex min-h-11 items-center text-sm text-ink/60 hover:text-ink"
                >
                  Remove all
                </button>
              </>
            ) : (
              <p className="text-pretty text-sm text-ink/60">Pick pieces from the list to start building an outfit.</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-10">
          <section aria-labelledby="char-heading">
            <h2 id="char-heading" className="font-display text-lg font-semibold">
              Mannequin
            </h2>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm text-ink/60">Body</legend>
                <div className="flex gap-2">
                  {genders.map((g) => (
                    <Choice key={g.id} active={gender === g.id} onClick={() => setGender(g.id)} label={`${g.label} mannequin`} className="min-h-11 px-4 text-sm">
                      {g.label}
                    </Choice>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm text-ink/60">Skin tone</legend>
                <div className="flex gap-2">
                  {skinTones.map((t) => (
                    <Choice key={t.id} active={skin === t.color} onClick={() => setSkin(t.color)} label={t.label} className="size-11 rounded-full">
                      <span className="block size-full rounded-full" style={{ backgroundColor: t.color }} />
                    </Choice>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm text-ink/60">Build</legend>
                <div className="flex gap-2">
                  {builds.map((b) => (
                    <Choice key={b.id} active={build === b.id} onClick={() => setBuild(b.id)} label={`${b.label} build`} className="min-h-11 px-3 text-sm">
                      {b.label}
                    </Choice>
                  ))}
                </div>
              </fieldset>

            </div>
            <p className="mt-4 text-sm text-ink/60">
              Suggested clothing size for this build: <span className="font-medium text-ink">{suggestedSize}</span>
            </p>
          </section>

          {sections.map(({ slot, label: heading, note }) => (
            <section key={slot} aria-labelledby={`slot-${slot}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={`slot-${slot}`} className="font-display text-lg font-semibold">
                  {heading}
                </h2>
                {outfit[slot] && (
                  <button
                    type="button"
                    onClick={() => setOutfit((o) => wear(o, productById(o[slot]!)))}
                    className="inline-flex min-h-11 items-center text-sm text-ink/60 hover:text-ink"
                  >
                    Remove {heading.split(' & ')[0].toLowerCase()}
                  </button>
                )}
              </div>
              {note && <p className="mt-1 text-sm text-ink/60">{note}</p>}
              <div className="mt-3 grid grid-cols-3 gap-3 lg:grid-cols-4">
                {products
                  .filter((p) => p.slot === slot && (!REALISTIC || p.model))
                  .map((p) => {
                    const active = outfit[slot] === p.id;
                    return (
                      <Choice
                        key={p.id}
                        active={active}
                        onClick={() => setOutfit((o) => wear(o, p))}
                        label={`${active ? 'Remove' : 'Wear'} ${p.name}`}
                        className="bg-white p-2 text-left"
                      >
                        <ProductImage product={p} label="" className="aspect-[5/6] w-full" />
                        <span className="mt-1 block truncate text-xs">{p.name}</span>
                        <span className="block text-xs text-ink/55 tabular-nums">{formatPrice(p.price)}</span>
                      </Choice>
                    );
                  })}
              </div>
            </section>
          ))}

          <p className="text-pretty text-sm text-ink/60">
            The model shows how colours and weaves go together. Try the real fit and size at{' '}
            <Link to="/contact" className="text-hom hover:underline">
              the shop
            </Link>
          </p>

          {REALISTIC && <ModelCredits />}
        </div>
      </div>
    </div>
  );
}
