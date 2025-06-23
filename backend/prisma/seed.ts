import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create the "General" league
  const generalLeague = await prisma.league.upsert({
    where: { id: 'general' },
    update: {},
    create: {
      id: 'general',
      name: 'General',
      description: 'Public league for all players.',
      joinCode: randomBytes(4).toString('hex'), // 8-char random code
    },
  });
  console.log('✅ Created/verified General league:', generalLeague.name);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin User',
    },
  });
  console.log('✅ Created admin user:', adminUser.email);

  // Make the admin user an admin of the General league
  await prisma.leagueMember.upsert({
    where: {
      leagueId_userId: {
        leagueId: generalLeague.id,
        userId: adminUser.id,
    },
    },
    update: { role: 'ADMIN' },
    create: {
      leagueId: generalLeague.id,
      userId: adminUser.id,
      role: 'ADMIN',
    },
  });
  console.log(
    `✅ Made ${adminUser.email} an ADMIN of ${generalLeague.name}`
  );

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 