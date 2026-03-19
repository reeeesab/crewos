require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const product = await prisma.product.findFirst();
  if (!product) {
    console.log('No product found');
    await prisma.$disconnect();
    return;
  }
  try {
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        inviteCodeHash: 'test-check-123',
        inviteCodeHint: 'CHK',
        inviteCodeUpdatedAt: new Date(),
      },
    });
    console.log('Update succeeded:', { id: updated.id, inviteCodeHint: updated.inviteCodeHint, inviteCodeHashPresent: typeof updated.inviteCodeHash !== 'undefined' });
  } catch (e) {
    console.error('Update failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
