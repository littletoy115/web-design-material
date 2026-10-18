import { cn } from '../cn';

export default function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex gap-0.5', className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-4" aria-hidden>
          <path
            d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z"
            fill={i < rating ? '#A88B4A' : 'none'}
            stroke="#A88B4A"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}
