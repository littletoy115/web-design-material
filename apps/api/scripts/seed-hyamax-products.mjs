// Seed Hyamax product line
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PRODUCTS = [
  { sku: 'HYAMAX-FINE', name: 'Hyamax Fine', category: 'Hyamax' },
  { sku: 'HYAMAX-DEEP', name: 'Hyamax Deep', category: 'Hyamax' },
  { sku: 'HYAMAX-EXTRA-DEEP', name: 'Hyamax Extra Deep', category: 'Hyamax' },
  { sku: 'HYAMAX-LIPS', name: 'Hyamax Lips', category: 'Hyamax' },
];

async function main() {
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, category: p.category },
      create: { sku: p.sku, name: p.name, category: p.category },
    });
    console.log(`OK ${product.sku} - ${product.name}`);
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
