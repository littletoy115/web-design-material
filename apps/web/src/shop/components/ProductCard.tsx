import { Link } from 'react-router-dom';
import { fabricById, formatPrice, type Product } from '../data';
import ProductImage from './ProductImage';

export default function ProductCard({ product }: { product: Product }) {
  const fabric = product.fabricId ? fabricById(product.fabricId) : undefined;
  return (
    <article className="group">
      <div className="relative aspect-[5/6] bg-white">
        <ProductImage
          product={product}
          label={fabric ? `${product.name}, made from ${fabric.name}` : product.name}
          className="absolute inset-0 size-full p-6"
        />
        {product.isNew && (
          <span className="absolute left-3 top-3 bg-hom px-2 py-0.5 text-xs font-medium text-cotton">New</span>
        )}
        {product.sample && (
          <span className="absolute left-3 top-3 border border-ink/20 bg-white px-2 py-0.5 text-xs text-ink/70">3D sample</span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-pretty text-[15px] font-medium leading-snug">{product.name}</h3>
          <p className="mt-0.5 text-sm text-ink/60">
            {fabric ? `${fabric.name}, ${fabric.origin}` : product.credit ? `3D model by ${product.credit.author || 'MakeHuman community'}` : product.category}
          </p>
        </div>
        <p className="shrink-0 text-[15px] tabular-nums">{formatPrice(product.price)}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/50">Sizes {product.sizes.join(' / ')}</p>
        <Link
          to={`/fitting?item=${product.id}`}
          className="inline-flex min-h-11 items-center text-sm font-medium text-hom hover:underline"
          aria-label={`Try on ${product.name}`}
        >
          Try on
        </Link>
      </div>
    </article>
  );
}
