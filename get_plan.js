const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const service = await prisma.service.findFirst({
    include: { plans: true }
  });
  if (service && service.plans.length > 0) {
    console.log(`URL: http://localhost:3000/checkout?service=${service.slug}&planId=${service.plans[0].id}`);
  } else {
    console.log("No services or plans found in database");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
