import { Link } from 'react-router-dom';
import { fabrics, productById, products, reviews, store } from '../data';
import { Swatch } from '../components/FabricArt';
import ProductCard from '../components/ProductCard';
import Stars from '../components/Stars';
import { usePageTitle } from '../usePageTitle';

const featuredReview = reviews[0];

export default function HomePage() {
  usePageTitle('');
  const newArrivals = products.filter((p) => p.isNew).slice(0, 8);

  return (
    <>
      {/* Hero: the five cloths we work with, laid out like bolts on a shelf */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[5fr_7fr] md:items-end">
          <div>
            <h1 className="text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Know where every cloth comes from before it becomes a shirt
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-ink/70">
              We cut our clothes from five hand-woven, hand-dyed cloths made by craftspeople in Phrae, Chiang Mai, Sakon Nakhon, Maha Sarakham and Khon Kaen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/collection"
                className="inline-flex min-h-12 items-center bg-hom px-6 font-medium text-cotton transition-colors hover:bg-hom-dark"
              >
                Shop the collection
              </Link>
              <Link
                to="/stories"
                className="inline-flex min-h-12 items-center border border-ink/25 px-6 font-medium transition-colors hover:border-ink"
              >
                Read the fabric stories
              </Link>
            </div>
          </div>

          <ul className="grid grid-cols-5 gap-2 sm:gap-3">
            {fabrics.map((f, i) => (
              <li key={f.id} className={i % 2 === 1 ? 'md:pt-10' : ''}>
                <Link to={`/stories#${f.id}`} className="block">
                  <Swatch
                    weave={f.weave}
                    colors={f.colors}
                    label={`${f.name} cloth`}
                    className="aspect-[1/2] w-full md:aspect-[1/3]"
                  />
                  <span className="mt-2 block text-pretty text-xs font-medium leading-snug sm:text-sm">{f.name}</span>
                  <span className="hidden text-xs text-ink/55 sm:block">{f.origin}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="new-heading">
        <div className="flex items-end justify-between gap-4 border-t border-faded/50 pt-10">
          <h2 id="new-heading" className="text-balance font-display text-2xl font-semibold sm:text-3xl">
            New this October
          </h2>
          <Link to="/collection" className="inline-flex min-h-11 items-center text-sm font-medium text-hom hover:underline">
            See all {products.length} pieces
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* One customer voice */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <figure className="max-w-3xl">
          <Stars rating={featuredReview.rating} />
          <blockquote className="mt-4 text-balance font-display text-2xl font-medium leading-snug sm:text-3xl">
            “{featuredReview.body}”
          </blockquote>
          <figcaption className="mt-5 text-sm text-ink/65">
            {featuredReview.author}, {featuredReview.city} — {productById(featuredReview.productId).name}
          </figcaption>
        </figure>
        <Link to="/reviews" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-hom hover:underline">
          Read all {reviews.length} reviews
        </Link>
      </section>

      {/* Visit */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 bg-white p-8 sm:p-10 md:grid-cols-2">
          <div>
            <h2 className="text-balance font-display text-2xl font-semibold">Want to feel the cloth first?</h2>
            <p className="mt-3 max-w-md text-pretty leading-relaxed text-ink/70">
              A screen can't show everything about handwoven cloth. Message us to book a fitting with swatches of all five fabrics and every size to try on.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Opening hours</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 tabular-nums">
              {store.hours.map((h) => (
                <div key={h.days} className="contents">
                  <dt className="text-ink/60">{h.days}</dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
            <Link to="/contact" className="mt-5 inline-flex min-h-11 items-center font-medium text-hom hover:underline">
              Contact us to book a fitting
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
