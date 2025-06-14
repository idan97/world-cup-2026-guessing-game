import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'Admin User',
      colboNumber: 'ADMIN001',
      isApproved: true,
      role: 'ADMIN',
      requestedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      displayName: 'Test User',
      colboNumber: 'TEST001',
      isApproved: true,
      role: 'USER',
      requestedAt: new Date(),
      approvedAt: new Date(),
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create unapproved user
  const unapprovedUser = await prisma.user.upsert({
    where: { email: 'pending@example.com' },
    update: {},
    create: {
      email: 'pending@example.com',
      displayName: 'Pending User',
      colboNumber: 'PEND001',
      isApproved: false,
      role: 'USER',
      requestedAt: new Date(),
    },
  });

  console.log('✅ Created pending user:', unapprovedUser.email);

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