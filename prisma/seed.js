"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@thickwire.com';
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (!existing) {
        const passwordHash = await bcrypt.hash('admin123', 12);
        await prisma.admin.create({
            data: {
                name: 'Super Admin',
                email,
                passwordHash,
                role: 'SUPER_ADMIN',
                isActive: true,
            },
        });
        console.log('Seeded default admin: admin@thickwire.com / admin123');
    }
    else {
        console.log('Default admin already exists');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map