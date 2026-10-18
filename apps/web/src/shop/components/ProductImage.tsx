import { cn } from '../cn';
import { fabricById, type Product } from '../data';
import { GarmentArt } from './FabricArt';

/** Drawn garment for Homfaai pieces, the product picture for everything else. */
export default function ProductImage({ product, className, label }: { product: Product; className?: string; label?: string }) {
  const alt = label ?? product.name;
  if (product.garment && product.fabricId) {
    const f = fabricById(product.fabricId);
    return <GarmentArt garment={product.garment} weave={f.weave} colors={f.colors} label={alt} className={className} />;
  }
  if (product.image) {
    return <img src={product.image} alt={alt} loading="lazy" className={cn('object-contain', className)} />;
  }
  return <div className={cn('bg-faded/20', className)} role="img" aria-label={alt} />;
}
