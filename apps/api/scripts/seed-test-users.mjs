// Seed 3 demo users for the memo approval flow: Sale -> Audit -> Manager
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const USERS = [
  { email: 'user01@demo.com', name: 'User01', role: 'SALE' },
  { email: 'user02@demo.com', name: 'User02', role: 'AUDIT' },
  { email: 'user03@demo.com', name: 'User03', role: 'MANAGER' },
  { email: 'user04@demo.com', name: 'User04', role: 'LOGISTIC' },
];

async function main() {
  const hashed = await bcrypt.hash('password', 10);
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: { email: u.email, name: u.name, role: u.role, password: hashed },
    });
    console.log(`OK ${user.email} (${user.role})`);
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
