require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

async function main() {
  const clerkId = process.env.SEED_CLERK_ID || 'local-seed-clerk-id';
  const email = process.env.SEED_EMAIL || 'dev+seed@example.com';
  const name = process.env.SEED_NAME || 'Dev Seed';

  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: process.env.SEED_PRODUCT_NAME || 'Seed Product',
        description: 'Auto-created for local dev seed',
      },
    });
    console.log('Created Product:', product.id);
  }

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email, name },
    create: { clerkId, email, name },
  });
  console.log('Upserted user:', { id: user.id, clerkId: user.clerkId, email: user.email });

  let member = await prisma.productMember.findFirst({
    where: { productId: product.id, userId: user.id },
  });

  if (!member) {
    member = await prisma.productMember.create({
      data: {
        productId: product.id,
        userId: user.id,
        role: 'OWNER',
        permissions: {},
      },
    });
    console.log('Created ProductMember as OWNER for product:', product.id);
  } else {
    console.log('ProductMember already exists:', { id: member.id, role: member.role });
  }

  const refreshedUser = await prisma.user.findUnique({ where: { id: user.id }, include: { products: true } });
  console.log('Final user record:', refreshedUser);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
