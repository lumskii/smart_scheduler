import { PrismaClient } from '../src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      clerkId: 'test_clerk_id',
      email: 'test@example.com',
      name: 'Test User',
      timezone: 'UTC',
      // Add default availability for weekdays (Mon-Fri)
      availabilities: {
        create: Array.from({ length: 5 }, (_, i) => ({
          weekday: i + 1, // Monday = 1, Friday = 5
          startMin: 9 * 60, // 9:00 AM
          endMin: 17 * 60, // 5:00 PM
        })),
      },
      // Set default buffer time
      buffer: {
        create: {
          minutes: 15,
        },
      },
    },
  });

  console.log({ user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
