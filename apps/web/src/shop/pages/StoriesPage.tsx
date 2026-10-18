import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../cn';
import { fabrics, products } from '../data';
import { Swatch } from '../components/FabricArt';
import { usePageTitle } from '../usePageTitle';

// From plant to garment — a real sequence, so it is numbered.
const process = [
  { title: 'Grow and pick', body: 'Native cotton is planted after the rice harvest and picked by hand when the bolls open.' },
  { title: 'Gin, fluff, spin', body: 'Seeds are removed, the fibre is beaten loose, then spun into yarn one thread at a time.' },
  { title: 'Dye', body: 'Dipped in fermented hom or indigo and aired, again and again, until the colour is right.' },
  { title: 'Weave', body: 'Woven on a traditional or fly-shuttle loom, 2–4 metres a day.' },
  { title: 'Cut and sew', body: 'Cut in our Bangkok workroom, with patterns laid out to waste as little cloth as possible.' },
];

export default function StoriesPage() {
  usePageTitle('Fabric stories');
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-balance font-display text-3xl font-semibold sm:text-4xl">Fabric stories</h1>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-ink/70">
          A single handwoven cloth passes through at least five pairs of hands before it reaches our workroom. This page tells you
          where each of our fabrics comes from, and why it looks the way it does.
        </p>
      </header>

      <section aria-labelledby="process-heading" className="mt-16">
        <h2 id="process-heading" className="font-display text-xl font-semibold">
          From cotton plant to shirt
        </h2>
        <ol className="mt-6 grid gap-px bg-faded/50 sm:grid-cols-2 lg:grid-cols-5">
          {process.map((step, i) => (
            <li key={step.title} className="bg-cotton p-5 sm:pr-6">
              <span className="font-display text-sm font-semibold text-hom tabular-nums">Step {i + 1}</span>
              <h3 className="mt-2 font-medium">{step.title}</h3>
              <p className="mt-1 text-pretty text-sm leading-relaxed text-ink/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-20 space-y-20">
        {fabrics.map((f, i) => {
          const count = products.filter((p) => p.fabricId === f.id).length;
          return (
            <article
              key={f.id}
              id={f.id}
              className={cn(
                'grid scroll-mt-24 gap-8 border-t border-faded/50 pt-10 md:gap-12',
                i % 2 === 1 ? 'md:grid-cols-[3fr_2fr]' : 'md:grid-cols-[2fr_3fr]'
              )}
            >
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                <Swatch weave={f.weave} colors={f.colors} label={`${f.name} cloth, close up`} className="aspect-square w-full" />
              </div>
              <div className="max-w-prose">
                <p className="text-sm text-ink/60">{f.origin}</p>
                <h2 className="mt-1 text-balance font-display text-2xl font-semibold sm:text-3xl">{f.name}</h2>
                <p className="mt-4 text-pretty text-lg leading-relaxed">{f.summary}</p>
                {f.story.map((para) => (
                  <p key={para.slice(0, 16)} className="mt-4 text-pretty leading-relaxed text-ink/75">
                    {para}
                  </p>
                ))}
                <dl className="mt-6 border-l-2 border-thread pl-4 text-sm">
                  <dt className="font-medium">Care</dt>
                  <dd className="mt-1 text-ink/70">{f.care}</dd>
                </dl>
                <Link
                  to={`/collection?fabric=${f.id}`}
                  className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-hom hover:underline"
                >
                  Shop {f.name} ({count} {count === 1 ? 'piece' : 'pieces'})
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
