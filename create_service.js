const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const service = await prisma.service.create({
    data: {
      name: 'Prime Video',
      slug: 'prime',
      description: 'Amazon Prime Video',
      features: ['4K Ultra HD', '4 Screens'],
      category: 'streaming',
      basePrice: 299,
      isActive: true,
      plans: {
        create: [
          {
            name: 'Prime',
            durationDays: 180,
            price: 299,
            features: ['Instant Delivery'],
            isActive: true
          }
        ]
      }
    },
    include: { plans: true }
  });
  console.log(`URL: http://localhost:3000/checkout?service=${service.slug}&planId=${service.plans[0].id}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
