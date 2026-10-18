import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../cn';
import { fabricById, productById, reviews } from '../data';
import { GarmentArt } from '../components/FabricArt';
import Stars from '../components/Stars';
import { usePageTitle } from '../usePageTitle';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ReviewsPage() {
  usePageTitle('Reviews');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const total = reviews.length;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  const visible = ratingFilter ? reviews.filter((r) => r.rating === ratingFilter) : reviews;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">Reviews from people who wear them</h1>
      <p className="mt-3 max-w-xl text-pretty text-ink/70">
        We show every review we receive, including the critical ones, so you have the full picture.
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-[1fr_2fr]">
        {/* Summary + filter */}
        <aside className="md:sticky md:top-24 md:self-start">
          <p className="font-display text-5xl font-semibold tabular-nums">{average.toFixed(1)}</p>
          <Stars rating={Math.round(average)} className="mt-2" />
          <p className="mt-1 text-sm text-ink/60 tabular-nums">from {total} reviews</p>

          <ul className="mt-6 space-y-1">
            {counts.map(({ star, count }) => {
              const active = ratingFilter === star;
              return (
                <li key={star}>
                  <button
                    type="button"
                    disabled={count === 0}
                    aria-pressed={active}
                    onClick={() => setRatingFilter(active ? null : star)}
                    className={cn(
                      'grid min-h-11 w-full grid-cols-[3rem_1fr_2rem] items-center gap-3 px-2 text-left text-sm tabular-nums transition-colors disabled:opacity-40',
                      active ? 'bg-white' : 'hover:bg-white/60'
                    )}
                  >
                    <span>{star} {star === 1 ? 'star' : 'stars'}</span>
                    <span className="h-1.5 bg-faded/40" aria-hidden>
                      <span className="block h-full bg-thread" style={{ width: `${(count / total) * 100}%` }} />
                    </span>
                    <span className="text-right text-ink/60">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {ratingFilter && (
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-hom hover:underline"
            >
              Show all reviews
            </button>
          )}
        </aside>

        {/* List */}
        <ul className="divide-y divide-faded/50 border-y border-faded/50">
          {visible.map((r) => {
            const product = productById(r.productId);
            const fabric = fabricById(product.fabricId);
            return (
              <li key={r.id} className="grid grid-cols-[4rem_1fr] gap-4 py-8 sm:grid-cols-[5rem_1fr] sm:gap-6">
                <div className="aspect-[5/6] bg-white">
                  <GarmentArt
                    garment={product.garment}
                    weave={fabric.weave}
                    colors={fabric.colors}
                    label={product.name}
                    className="size-full p-2"
                  />
                </div>
                <article>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars rating={r.rating} />
                    <time dateTime={r.date} className="text-xs text-ink/55">
                      {dateFormat.format(new Date(r.date))}
                    </time>
                  </div>
                  <p className="mt-3 text-pretty leading-relaxed">{r.body}</p>
                  <p className="mt-3 text-sm text-ink/60">
                    {r.author}, {r.city}, bought{' '}
                    <Link to={`/collection?fabric=${fabric.id}`} className="text-hom hover:underline">
                      {product.name}
                    </Link>
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
