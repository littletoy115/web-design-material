import { useSearchParams } from 'react-router-dom';
import { cn } from '../cn';
import { categories, fabrics, products, type Category } from '../data';
import ProductCard from '../components/ProductCard';
import { usePageTitle } from '../usePageTitle';

type Sort = 'new' | 'price-asc' | 'price-desc';

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-11 border px-4 text-sm transition-colors',
        active ? 'border-hom bg-hom text-cotton' : 'border-ink/20 hover:border-ink/60'
      )}
    >
      {children}
    </button>
  );
}

export default function CollectionPage() {
  usePageTitle('Collection');
  // Filters live in the URL so a filtered view can be shared or bookmarked.
  const [params, setParams] = useSearchParams();
  const category = params.get('category') as Category | null;
  const fabric = params.get('fabric');
  const sort = (params.get('sort') as Sort | null) ?? 'new';

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const visible = products
    .filter((p) => !category || p.category === category)
    .filter((p) => !fabric || p.fabricId === fabric)
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return Number(!!b.isNew) - Number(!!a.isNew);
    });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">Collection</h1>
      <p className="mt-3 max-w-xl text-pretty text-ink/70">
        Every piece is cut in small runs from each batch of cloth. Browse by type or by the fabric you like.
      </p>

      <div className="mt-10 space-y-5 border-y border-faded/50 py-6">
        <fieldset>
          <legend className="mb-2 text-sm text-ink/60">Type</legend>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!category} onClick={() => update('category', null)}>
              All
            </FilterChip>
            {categories.map((c) => (
              <FilterChip key={c} active={category === c} onClick={() => update('category', c)}>
                {c}
              </FilterChip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm text-ink/60">Fabric</legend>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!fabric} onClick={() => update('fabric', null)}>
              All fabrics
            </FilterChip>
            {fabrics.map((f) => (
              <FilterChip key={f.id} active={fabric === f.id} onClick={() => update('fabric', f.id)}>
                {f.name}
              </FilterChip>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-ink/60 tabular-nums" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'item' : 'items'}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink/60">Sort by</span>
          <select
            value={sort}
            onChange={(e) => update('sort', e.target.value === 'new' ? null : e.target.value)}
            className="min-h-11 border border-ink/20 bg-cotton px-3"
          >
            <option value="new">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-8 bg-white px-6 py-16 text-center">
          <p className="text-pretty">Nothing matches these filters yet.</p>
          <button
            type="button"
            onClick={() => setParams(new URLSearchParams(), { replace: true })}
            className="mt-4 inline-flex min-h-11 items-center bg-hom px-5 text-sm font-medium text-cotton hover:bg-hom-dark"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
