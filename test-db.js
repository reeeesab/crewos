const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany();
    console.log('Successfully connected to DB. Products found:', products.length);
  } catch (e) {
    console.error('Failed to connect to DB:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
