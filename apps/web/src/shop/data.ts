import catalog3d from './catalog3d.json';

export type Weave = 'plain' | 'stripe' | 'check' | 'shibori' | 'herringbone';
export type Garment =
  // tops
  | 'tee' | 'shirt' | 'longshirt' | 'tank' | 'hoodie' | 'knit'
  // outerwear
  | 'jacket' | 'coat' | 'vest'
  // bottoms
  | 'pants' | 'wide' | 'shorts' | 'skirt' | 'pleated'
  // dresses
  | 'dress' | 'shirtdress' | 'maxi'
  // shoes
  | 'sneakers' | 'loafers' | 'boots' | 'sandals'
  // hats
  | 'bucket' | 'cap' | 'beanie' | 'straw';

/** Where each garment is worn; one item per slot. */
export type Slot = 'top' | 'outer' | 'bottom' | 'dress' | 'shoes' | 'hat';
export const garmentSlot: Record<Garment, Slot> = {
  tee: 'top', shirt: 'top', longshirt: 'top', tank: 'top', hoodie: 'top', knit: 'top',
  jacket: 'outer', coat: 'outer', vest: 'outer',
  pants: 'bottom', wide: 'bottom', shorts: 'bottom', skirt: 'bottom', pleated: 'bottom',
  dress: 'dress', shirtdress: 'dress', maxi: 'dress',
  sneakers: 'shoes', loafers: 'shoes', boots: 'shoes', sandals: 'shoes',
  bucket: 'hat', cap: 'hat', beanie: 'hat', straw: 'hat',
};

export type Category = 'Tops' | 'Outerwear' | 'Pants' | 'Skirts' | 'Dresses' | 'Sets' | 'Shoes' | 'Hats';
export const categories: Category[] = ['Tops', 'Outerwear', 'Pants', 'Skirts', 'Dresses', 'Sets', 'Shoes', 'Hats'];

export interface Fabric {
  id: string;
  name: string;
  origin: string;
  weave: Weave;
  /** base / thread colors used to draw the swatch */
  colors: [string, string];
  summary: string;
  story: string[];
  care: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  slot: Slot;
  price: number;
  sizes: string[];
  isNew?: boolean;
  /** Homfaai pieces: drawn shape and woven fabric (also used as the 3D texture) */
  garment?: Garment;
  fabricId?: string;
  /** id of the fitted 3D garment in /models (MakeHuman) */
  model?: string;
  /** product picture, for pieces without a drawn shape */
  image?: string;
  /** third-party 3D asset: who made it and under which licence */
  credit?: { author: string; license: string };
  /** sample piece added to try out the 3D fitting room, not a Homfaai product */
  sample?: boolean;
}

export interface Review {
  id: string;
  author: string;
  city: string;
  productId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  body: string;
}

export const fabrics: Fabric[] = [
  {
    id: 'hom-indigo',
    name: 'Phrae Indigo',
    origin: 'Ban Thung Hong, Phrae',
    weave: 'plain',
    colors: ['#2D4B80', '#3E5E96'],
    summary: 'Handwoven cotton dyed with fermented hom indigo in clay pots. The colour deepens with every dip.',
    story: [
      'Hom leaves ferment in clay jars for about a month until the dye bath turns yellow-green. Cloth lifted out of the pot slowly turns blue as it meets the air.',
      'Each bolt is dipped and aired 8–12 times. The dyer judges the colour by eye and decides when it is done, so every batch is slightly different.',
    ],
    care: 'Hand wash cold and separately for the first 3 washes. Dry in the shade.',
  },
  {
    id: 'handspun',
    name: 'Handspun Cotton',
    origin: 'Chom Thong, Chiang Mai',
    weave: 'herringbone',
    colors: ['#E4E1D6', '#C9C3B1'],
    summary: 'Yarn spun by hand, uneven in thickness, woven into a herringbone with a clear texture.',
    story: [
      'Native cotton is ginned, fluffed and spun into yarn one thread at a time. The yarn keeps small slubs that machines cannot make.',
      'Herringbone helps the cloth drape well and resist creasing, which suits an outer layer you can wear all year.',
    ],
    care: 'Machine wash on a gentle cycle. No bleach.',
  },
  {
    id: 'shibori',
    name: 'Indigo Tie-Dye',
    origin: 'Sakon Nakhon',
    weave: 'shibori',
    colors: ['#23395F', '#C8D1E0'],
    summary: 'Cotton bound with cord before it goes into the indigo vat. No two pieces share the same circles.',
    story: [
      'The dyer binds small points of cloth with hemp cord. Tightly bound areas resist the dye, so pale rings appear across the indigo when the cord comes off.',
      'How tight the cord is and how long the cloth soaks make each ring crisp or soft. We keep that unevenness on purpose.',
    ],
    care: 'Hand wash cold. Turn inside out before drying.',
  },
  {
    id: 'loincloth-check',
    name: 'Pakama Check',
    origin: 'Ban Nong Khuean Chang, Maha Sarakham',
    weave: 'check',
    colors: ['#F2F3F0', '#2D4B80'],
    summary: 'A check from the fly-shuttle loom, scaled down for clothes you wear in the city.',
    story: [
      'Traditional pakama cloth is woven in large, bright checks. We worked with the weaving group to shrink the check to about 6 mm and use just two colours.',
      'The warp is mill-spun cotton for strength and the weft is handspun, so the cloth is soft but keeps its shape.',
    ],
    care: 'Machine wash cold. Iron on medium.',
  },
  {
    id: 'linen-stripe',
    name: 'Striped Linen',
    origin: 'Woven with a mill in Khon Kaen',
    weave: 'stripe',
    colors: ['#DCE1EA', '#2D4B80'],
    summary: 'A 55/45 linen-cotton blend with a wide stripe. Breathable for the hot season.',
    story: [
      'Linen keeps the cloth cool and quick to dry; cotton cuts down on creasing. The ratio came from cutting many test shirts through a Bangkok summer.',
      'The stripe is woven in, not printed, so it will not fade or peel after years of washing.',
    ],
    care: 'Machine wash cold. Hang while still damp to reduce creases.',
  },
];

const SHOE_SIZES = ['38', '39', '40', '41', '42', '43', '44'];
const ONE_SIZE = ['One size'];

/** Homfaai's own pieces: a drawn shape plus one of our woven fabrics. */
type OwnProduct = Omit<Product, 'slot'> & { garment: Garment; fabricId: string };

const ownProducts: OwnProduct[] = [
  { id: 'p01', name: 'Mandarin Collar Shirt, Phrae Indigo', category: 'Tops', garment: 'shirt', fabricId: 'hom-indigo', price: 1290, sizes: ['S', 'M', 'L', 'XL'], isNew: true },
  { id: 'p02', name: 'Work Jacket, Herringbone', category: 'Outerwear', garment: 'jacket', fabricId: 'handspun', price: 2450, sizes: ['M', 'L', 'XL'], isNew: true },
  { id: 'p03', name: 'Sleeveless Dress, Tie-Dye', category: 'Dresses', garment: 'dress', fabricId: 'shibori', price: 1890, sizes: ['S', 'M', 'L'], isNew: true },
  { id: 'p04', name: 'Straight Trousers, Pakama Check', category: 'Pants', garment: 'pants', fabricId: 'loincloth-check', price: 1150, sizes: ['S', 'M', 'L', 'XL'], isNew: true },
  { id: 'p05', name: 'Short-Sleeve Shirt, Striped Linen', category: 'Tops', garment: 'shirt', fabricId: 'linen-stripe', price: 1090, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'p06', name: 'Elastic-Waist Trousers, Phrae Indigo', category: 'Pants', garment: 'pants', fabricId: 'hom-indigo', price: 1190, sizes: ['S', 'M', 'L'] },
  { id: 'p07', name: 'Long Coat, Tie-Dye', category: 'Outerwear', garment: 'coat', fabricId: 'shibori', price: 2290, sizes: ['M', 'L'] },
  { id: 'p08', name: 'Shirt Dress, Striped Linen', category: 'Dresses', garment: 'shirtdress', fabricId: 'linen-stripe', price: 1650, sizes: ['S', 'M', 'L'] },
  { id: 'p09', name: 'Crew Neck Tee, Handspun Cotton', category: 'Tops', garment: 'tee', fabricId: 'handspun', price: 990, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'p10', name: 'Maxi Dress, Phrae Indigo', category: 'Dresses', garment: 'maxi', fabricId: 'hom-indigo', price: 1990, sizes: ['S', 'M'] },
  { id: 'p11', name: 'Wide-Leg Trousers, Striped Linen', category: 'Pants', garment: 'wide', fabricId: 'linen-stripe', price: 1250, sizes: ['M', 'L', 'XL'] },
  { id: 'p12', name: 'Cropped Jacket, Pakama Check', category: 'Outerwear', garment: 'jacket', fabricId: 'loincloth-check', price: 2190, sizes: ['S', 'M', 'L'] },
  { id: 'p13', name: 'Long-Sleeve Shirt, Pakama Check', category: 'Tops', garment: 'longshirt', fabricId: 'loincloth-check', price: 1390, sizes: ['S', 'M', 'L', 'XL'], isNew: true },
  { id: 'p14', name: 'Tank Top, Striped Linen', category: 'Tops', garment: 'tank', fabricId: 'linen-stripe', price: 690, sizes: ['S', 'M', 'L'] },
  { id: 'p15', name: 'Hoodie, Handspun Cotton', category: 'Tops', garment: 'hoodie', fabricId: 'handspun', price: 1890, sizes: ['S', 'M', 'L', 'XL'], isNew: true },
  { id: 'p16', name: 'Knit Sweater, Phrae Indigo', category: 'Tops', garment: 'knit', fabricId: 'hom-indigo', price: 1690, sizes: ['M', 'L', 'XL'] },
  { id: 'p17', name: 'Vest, Herringbone', category: 'Outerwear', garment: 'vest', fabricId: 'handspun', price: 1250, sizes: ['S', 'M', 'L'] },
  { id: 'p18', name: 'Shorts, Phrae Indigo', category: 'Pants', garment: 'shorts', fabricId: 'hom-indigo', price: 790, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'p19', name: 'A-Line Skirt, Tie-Dye', category: 'Skirts', garment: 'skirt', fabricId: 'shibori', price: 1290, sizes: ['S', 'M', 'L'] },
  { id: 'p20', name: 'Pleated Skirt, Pakama Check', category: 'Skirts', garment: 'pleated', fabricId: 'loincloth-check', price: 1190, sizes: ['S', 'M'], isNew: true },
  { id: 'p21', name: 'Tee, Phrae Indigo', category: 'Tops', garment: 'tee', fabricId: 'hom-indigo', price: 650, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'p22', name: 'Canvas Sneakers, Phrae Indigo', category: 'Shoes', garment: 'sneakers', fabricId: 'hom-indigo', price: 1590, sizes: SHOE_SIZES, isNew: true },
  { id: 'p23', name: 'Slip-Ons, Pakama Check', category: 'Shoes', garment: 'loafers', fabricId: 'loincloth-check', price: 1290, sizes: SHOE_SIZES },
  { id: 'p24', name: 'Ankle Boots, Herringbone', category: 'Shoes', garment: 'boots', fabricId: 'handspun', price: 2290, sizes: SHOE_SIZES },
  { id: 'p25', name: 'Sandals, Linen Straps', category: 'Shoes', garment: 'sandals', fabricId: 'linen-stripe', price: 590, sizes: SHOE_SIZES },
  { id: 'p26', name: 'Bucket Hat, Phrae Indigo', category: 'Hats', garment: 'bucket', fabricId: 'hom-indigo', price: 590, sizes: ONE_SIZE, isNew: true },
  { id: 'p27', name: 'Cap, Striped Linen', category: 'Hats', garment: 'cap', fabricId: 'linen-stripe', price: 490, sizes: ONE_SIZE },
  { id: 'p28', name: 'Beanie, Phrae Indigo', category: 'Hats', garment: 'beanie', fabricId: 'hom-indigo', price: 450, sizes: ONE_SIZE },
  { id: 'p29', name: 'Wide-Brim Hat, Handspun Cotton', category: 'Hats', garment: 'straw', fabricId: 'handspun', price: 890, sizes: ONE_SIZE },
  { id: 'p30', name: 'Wide-Leg Trousers, Tie-Dye', category: 'Pants', garment: 'wide', fabricId: 'shibori', price: 1390, sizes: ['S', 'M', 'L'] },
];

/** Closest fitted 3D garment for each of our shapes; our woven fabric is laid over it in the fitting room. */
const MODEL_FOR: Partial<Record<Garment, string>> = {
  tee: 'elvs-crude-t-shirt-male',
  shirt: 'namuhekam-male-polo-shirt',
  longshirt: 'elvs-male-shirt-untucked-bd1',
  tank: 'mindfront-tank-top-01',
  hoodie: 'elvs-hooded-sweat-jacket1',
  knit: 'mindfront-knitted-sweater-01',
  jacket: 'mindfront-lusekofta',
  coat: 'punkduck-winter-coat',
  pants: 'elvs-male-trouser',
  wide: 'toigo-harem-pants',
  shorts: 'elvs-male-trouser-short-1',
  skirt: 'elvs-gored-midi-skirt',
  pleated: 'elvs-pleated-plaid-mini-skirt',
  dress: 'toigo-shift-dress',
  shirtdress: 'elvs-simple-60s-dress',
  maxi: 'toigo-halter-dress-midi',
  sneakers: 'culturalibre-sneakers',
  loafers: 'elvs-flatshoe-plain1',
  boots: 'toigo-ankle-boots-female',
  sandals: 'elvs-caesar-sandals1',
  bucket: 'mindfront-fishing-hat-01',
  cap: 'mindfront-patrol-cap',
  beanie: 'elvs-slouchy-beanie1',
  straw: 'fedora01',
};

/* Fitted 3D garments built from MakeHuman assets (tools/fitting-room). */
type Catalog3dItem = { id: string; name: string; slot: string; kind: string; author: string; license: string; thumb: string };
const items3d = (catalog3d as { items: Catalog3dItem[] }).items;
const built3d = new Set(items3d.map((i) => i.id));

/** Plain underwear shown when no top or bottom is worn, so the mannequin is never bare. */
export const baseLayers3d = {
  top: items3d.find((i) => i.slot === 'base-top')?.id,
  bottom: items3d.find((i) => i.slot === 'base-bottom')?.id,
};

const SLOTS: Slot[] = ['top', 'outer', 'bottom', 'dress', 'shoes', 'hat'];
const SAMPLE_PRICE: Record<Slot, number> = { top: 690, outer: 1590, bottom: 990, dress: 1490, shoes: 1290, hat: 390 };

/** Sample pieces for trying out the fitting room, made from the 3D assets themselves. */
const samples: Product[] = items3d
  .filter((i) => (SLOTS as string[]).includes(i.slot))
  .map((i, n) => {
    const slot = i.slot as Slot;
    return {
      id: `s-${i.id}`,
      name: i.name,
      category: i.kind as Category,
      slot,
      price: SAMPLE_PRICE[slot] + (n % 5) * 100,
      sizes: slot === 'shoes' ? SHOE_SIZES : slot === 'hat' ? ONE_SIZE : ['S', 'M', 'L', 'XL'],
      model: i.id,
      image: i.thumb || undefined,
      credit: { author: i.author, license: i.license },
      sample: true,
    };
  });

export const products: Product[] = [
  ...ownProducts.map((p) => {
    const model = MODEL_FOR[p.garment];
    return { ...p, slot: garmentSlot[p.garment], model: model && built3d.has(model) ? model : undefined };
  }),
  ...samples,
];

export const reviews: Review[] = [
  { id: 'r01', author: 'Pim', city: 'Bangkok', productId: 'p01', rating: 5, date: '2026-09-28', body: 'The indigo is deeper than in the photos. It bled a little for the first three washes, as the label said, and has been steady since. People at work keep asking where I bought it.' },
  { id: 'r02', author: 'Ton', city: 'Chiang Mai', productId: 'p02', rating: 5, date: '2026-09-14', body: 'Thick cloth but not hot. The herringbone really shows in the sun. Size L fits well at 178 cm.' },
  { id: 'r03', author: 'Mind', city: 'Khon Kaen', productId: 'p03', rating: 4, date: '2026-09-02', body: 'Beautiful tie-dye, but the fabric is thinner than I expected. Better with a light layer underneath.' },
  { id: 'r04', author: 'A', city: 'Phuket', productId: 'p05', rating: 5, date: '2026-08-21', body: 'Genuinely comfortable in hot weather, and it creases less than the pure linen shirts I own.' },
  { id: 'r05', author: 'Noon', city: 'Bangkok', productId: 'p04', rating: 4, date: '2026-08-09', body: 'Nice cut and the small check looks tidy. A bit long for petite people; I had them hemmed.' },
  { id: 'r06', author: 'Boss', city: 'Nonthaburi', productId: 'p09', rating: 3, date: '2026-07-30', body: 'The cloth has the slubby texture they describe for handspun, which I like. Delivery took 6 days though, longer than quoted.' },
  { id: 'r07', author: 'Prae', city: 'Phrae', productId: 'p10', rating: 5, date: '2026-07-18', body: 'I am from Phrae and was happy to see our cloth cut into a dress like this. Every seam is neatly finished.' },
  { id: 'r08', author: 'Guy', city: 'Bangkok', productId: 'p07', rating: 5, date: '2026-07-03', body: 'Easy to throw over a white tee. The pattern is different from the one my friend bought at the same time.' },
];

export const store = {
  name: 'Homfaai',
  hours: [
    { days: 'Tue–Fri', time: '11:00–19:00' },
    { days: 'Sat–Sun', time: '10:00–20:00' },
    { days: 'Mon', time: 'Closed' },
  ],
  email: 'vorasit.som@gmail.com',
  line: 'littletoy115',
};

/** Opens a chat with the LINE ID in the LINE app. */
export const lineUrl = (id: string) => `https://line.me/ti/p/~${encodeURIComponent(id)}`;

export const fabricById = (id: string) => fabrics.find((f) => f.id === id)!;
export const productById = (id: string) => products.find((p) => p.id === id)!;

export const formatPrice = (n: number) => `THB ${n.toLocaleString('en-US')}`;
