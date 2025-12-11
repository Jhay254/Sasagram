import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'akivaga12@gmail.com';
    console.log(`Promoting user ${email} to ADMIN...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: UserRole.ADMIN },
        });
        console.log(`Success! User ${user.name} (${user.email}) is now an ADMIN.`);
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
