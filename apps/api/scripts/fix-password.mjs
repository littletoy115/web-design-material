// Script to rehash plain-text passwords in the DB
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, password: true } });

  for (const user of users) {
    // If not already a bcrypt hash (bcrypt hashes start with $2b$ or $2a$)
    if (!user.password.startsWith('$2')) {
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      console.log(`Updated password for ${user.email}`);
    } else {
      console.log(`Skipped ${user.email} (already hashed)`);
    }
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
