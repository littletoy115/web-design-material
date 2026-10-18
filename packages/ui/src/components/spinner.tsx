import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

export function Spinner({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return <Loader2 className={cn('size-5 animate-spin text-muted-foreground', className)} {...props} />;
}
