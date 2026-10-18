import { useId } from 'react';
import type { Garment, Weave } from '../data';

interface PatternProps {
  id: string;
  weave: Weave;
  colors: [string, string];
}

/** SVG <pattern> that approximates how each weave looks up close. */
export function WeavePattern({ id, weave, colors: [base, thread] }: PatternProps) {
  switch (weave) {
    case 'plain':
      return (
        <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill={base} />
          <path d="M0 0.5H4M0.5 0V4" stroke={thread} strokeWidth="1" />
        </pattern>
      );
    case 'stripe':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={base} />
          <rect x="0" width="2.5" height="12" fill={thread} />
        </pattern>
      );
    case 'check':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={base} />
          <rect width="4" height="12" fill={thread} opacity="0.55" />
          <rect width="12" height="4" fill={thread} opacity="0.55" />
        </pattern>
      );
    case 'shibori':
      return (
        <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
          <rect width="24" height="24" fill={base} />
          <circle cx="6" cy="6" r="3.5" fill="none" stroke={thread} strokeWidth="1.2" strokeDasharray="2 1.5" />
          <circle cx="18" cy="18" r="3.5" fill="none" stroke={thread} strokeWidth="1.2" strokeDasharray="2 1.5" />
          <circle cx="6" cy="6" r="1" fill={thread} opacity="0.6" />
          <circle cx="18" cy="18" r="1" fill={thread} opacity="0.6" />
        </pattern>
      );
    case 'herringbone':
      return (
        <pattern id={id} width="12" height="8" patternUnits="userSpaceOnUse">
          <rect width="12" height="8" fill={base} />
          <path d="M0 8L6 0M6 0L12 8" stroke={thread} strokeWidth="1.6" fill="none" />
        </pattern>
      );
  }
}

const garmentPaths: Record<Garment, { body: string; details: string }> = {
  // tops
  tee: {
    body: 'M70 30 L100 40 L130 30 L168 48 L186 96 L160 104 L150 82 L150 220 L50 220 L50 82 L40 104 L14 96 L32 48 Z',
    details: 'M70 30 Q100 52 130 30',
  },
  shirt: {
    body: 'M72 22 L100 36 L128 22 L168 40 L190 96 L162 106 L150 80 L150 220 L50 220 L50 80 L38 106 L10 96 L32 40 Z',
    details: 'M100 36 V220 M72 22 L88 46 L100 36 L112 46 L128 22',
  },
  longshirt: {
    body: 'M72 22 L100 36 L128 22 L166 40 L188 210 L166 214 L150 90 L150 220 L50 220 L50 90 L34 214 L12 210 L34 40 Z',
    details: 'M100 36 V220 M72 22 L88 46 L100 36 L112 46 L128 22 M13 196 L36 200 M187 196 L164 200',
  },
  tank: {
    body: 'M74 24 L86 24 Q100 64 114 24 L126 24 L132 80 L150 100 L150 220 L50 220 L50 100 L68 80 Z',
    details: '',
  },
  hoodie: {
    body: 'M66 40 Q100 4 134 40 L170 52 L188 210 L166 214 L152 100 L152 220 L48 220 L48 100 L34 214 L12 210 L30 52 Z',
    details: 'M78 44 Q100 64 122 44 M70 160 H130 L138 200 H62 Z M92 58 V84 M108 58 V84 M48 208 H152',
  },
  knit: {
    body: 'M72 28 Q100 44 128 28 L166 42 L186 206 L164 210 L150 92 L152 220 L48 220 L50 92 L36 210 L14 206 L34 42 Z',
    details: 'M48 206 H152 M48 212 H152 M15 194 L36 198 M185 194 L164 198 M72 28 Q100 52 128 28',
  },
  // outerwear
  jacket: {
    body: 'M68 18 L100 40 L132 18 L172 36 L190 202 L162 206 L154 92 L154 224 L46 224 L46 92 L38 206 L10 202 L28 36 Z',
    details: 'M100 40 V224 M68 18 L84 70 L100 40 L116 70 L132 18 M60 150 H86 M114 150 H140',
  },
  coat: {
    body: 'M70 12 L100 36 L130 12 L170 30 L190 192 L164 196 L156 88 L166 232 H34 L44 88 L36 196 L10 192 L30 30 Z',
    details: 'M100 36 V232 M70 12 L86 70 L100 36 L114 70 L130 12 M60 150 H86 M114 150 H140',
  },
  vest: {
    body: 'M70 20 L100 64 L130 20 L146 28 L150 84 L156 224 H44 L50 84 L54 28 Z',
    details: 'M100 64 V224 M66 150 H88 M112 150 H134',
  },
  // bottoms
  pants: {
    body: 'M56 22 H144 L162 222 H112 L100 92 L88 222 H38 Z',
    details: 'M56 34 H144 M100 34 V92',
  },
  wide: {
    body: 'M58 22 H142 L178 222 H112 L100 96 L88 222 H22 Z',
    details: 'M58 34 H142 M100 34 V96',
  },
  shorts: {
    body: 'M54 60 H146 L162 162 H108 L100 118 L92 162 H38 Z',
    details: 'M54 72 H146 M100 72 V118',
  },
  skirt: {
    body: 'M70 30 H130 L168 214 H32 Z',
    details: 'M70 42 H130',
  },
  pleated: {
    body: 'M66 50 H134 L162 164 H38 Z',
    details: 'M66 62 H134 M80 62 L66 164 M93 62 L87 164 M107 62 L113 164 M120 62 L134 164',
  },
  // dresses
  dress: {
    body: 'M78 20 L100 34 L122 20 L136 30 L128 84 L172 222 H28 L72 84 L64 30 Z',
    details: 'M72 84 H128',
  },
  shirtdress: {
    body: 'M76 20 L100 34 L124 20 L158 36 L174 82 L152 90 L140 70 L136 96 L160 224 H40 L64 96 L60 70 L48 90 L26 82 L42 36 Z',
    details: 'M100 34 V224 M76 20 L90 42 L100 34 L110 42 L124 20 M62 100 H138',
  },
  maxi: {
    body: 'M80 14 L86 14 L92 44 Q100 50 108 44 L114 14 L120 14 L128 70 L120 100 L168 232 H32 L80 100 L72 70 Z',
    details: 'M80 100 H120',
  },
  // shoes (side view)
  sneakers: {
    body: 'M22 152 Q30 112 70 112 L112 120 Q150 130 178 152 L180 168 H22 Z',
    details: 'M22 168 H180 V180 H22 Z M70 118 L80 150 M90 120 L98 150 M110 124 L116 150',
  },
  loafers: {
    body: 'M24 162 Q32 132 72 130 L120 134 Q160 142 178 162 L178 172 H24 Z',
    details: 'M70 138 Q96 152 120 138 M24 172 H178 V178 H24 Z',
  },
  boots: {
    body: 'M58 60 H112 L116 140 Q160 146 178 166 L178 176 H52 L54 140 Z',
    details: 'M52 176 H178 V184 H52 Z M66 76 H106',
  },
  sandals: {
    body: 'M54 172 Q78 122 104 172 H92 Q78 142 66 172 Z M108 172 Q132 128 156 172 H144 Q132 146 120 172 Z',
    details: 'M24 172 H180 V182 H24 Z',
  },
  // hats
  bucket: {
    body: 'M60 90 Q64 50 100 48 Q136 50 140 90 L172 122 Q100 138 28 122 Z',
    details: 'M60 90 Q100 100 140 90',
  },
  cap: {
    body: 'M54 122 Q54 60 104 58 Q150 60 152 122 Z M150 120 Q178 118 192 130 Q170 138 140 130 Z',
    details: 'M104 58 V122 M104 52 V58',
  },
  beanie: {
    body: 'M56 140 Q56 52 100 50 Q144 52 144 140 Z',
    details: 'M56 116 H144 M56 128 H144 M90 40 A10 10 0 1 0 110 40 A10 10 0 1 0 90 40',
  },
  straw: {
    body: 'M66 110 Q68 66 100 64 Q132 66 134 110 L188 126 Q100 150 12 126 Z',
    details: 'M66 102 Q100 114 134 102',
  },
};

interface GarmentArtProps {
  garment: Garment;
  weave: Weave;
  colors: [string, string];
  label: string;
  className?: string;
}

export function GarmentArt({ garment, weave, colors, label, className }: GarmentArtProps) {
  const id = `w${useId().replace(/:/g, '')}`;
  const { body, details } = garmentPaths[garment];
  return (
    <svg viewBox="0 0 200 240" role="img" aria-label={label} className={className}>
      <defs>
        <WeavePattern id={id} weave={weave} colors={colors} />
      </defs>
      <path d={body} fill={`url(#${id})`} stroke="#1C2438" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={details} fill="none" stroke="#1C2438" strokeOpacity="0.3" strokeWidth="1.2" />
    </svg>
  );
}

interface SwatchProps {
  weave: Weave;
  colors: [string, string];
  label: string;
  className?: string;
}

/** A flat piece of cloth with a frayed bottom edge. */
export function Swatch({ weave, colors, label, className }: SwatchProps) {
  const id = `s${useId().replace(/:/g, '')}`;
  const fray = Array.from({ length: 40 }, (_, i) => `M${i * 5 + 2.5} 190 v${4 + ((i * 7) % 5)}`).join(' ');
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <WeavePattern id={id} weave={weave} colors={colors} />
      </defs>
      <rect width="200" height="190" fill={`url(#${id})`} />
      <path d={fray} stroke={colors[1]} strokeWidth="1.4" />
    </svg>
  );
}
