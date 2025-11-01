import { LeagueRole, PrismaClient, TeamGroup } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// World Cup 2026 teams (48 teams across 12 groups)
const teams = [
  // Group A
  { id: 'USA', name: 'United States', group: TeamGroup.A },
  { id: 'MEX', name: 'Mexico', group: TeamGroup.A },
  { id: 'CAN', name: 'Canada', group: TeamGroup.A },
  { id: 'JAM', name: 'Jamaica', group: TeamGroup.A },
  // Group B
  { id: 'BRA', name: 'Brazil', group: TeamGroup.B },
  { id: 'ARG', name: 'Argentina', group: TeamGroup.B },
  { id: 'CHI', name: 'Chile', group: TeamGroup.B },
  { id: 'PER', name: 'Peru', group: TeamGroup.B },
  // Group C
  { id: 'FRA', name: 'France', group: TeamGroup.C },
  { id: 'ENG', name: 'England', group: TeamGroup.C },
  { id: 'GER', name: 'Germany', group: TeamGroup.C },
  { id: 'ESP', name: 'Spain', group: TeamGroup.C },
  // Group D
  { id: 'ITA', name: 'Italy', group: TeamGroup.D },
  { id: 'NED', name: 'Netherlands', group: TeamGroup.D },
  { id: 'BEL', name: 'Belgium', group: TeamGroup.D },
  { id: 'POR', name: 'Portugal', group: TeamGroup.D },
  // Group E
  { id: 'JPN', name: 'Japan', group: TeamGroup.E },
  { id: 'KOR', name: 'South Korea', group: TeamGroup.E },
  { id: 'AUS', name: 'Australia', group: TeamGroup.E },
  { id: 'NZL', name: 'New Zealand', group: TeamGroup.E },
  // Group F
  { id: 'EGY', name: 'Egypt', group: TeamGroup.F },
  { id: 'MAR', name: 'Morocco', group: TeamGroup.F },
  { id: 'SEN', name: 'Senegal', group: TeamGroup.F },
  { id: 'NGA', name: 'Nigeria', group: TeamGroup.F },
  // Group G
  { id: 'URU', name: 'Uruguay', group: TeamGroup.G },
  { id: 'COL', name: 'Colombia', group: TeamGroup.G },
  { id: 'ECU', name: 'Ecuador', group: TeamGroup.G },
  { id: 'VEN', name: 'Venezuela', group: TeamGroup.G },
  // Group H
  { id: 'DEN', name: 'Denmark', group: TeamGroup.H },
  { id: 'SWE', name: 'Sweden', group: TeamGroup.H },
  { id: 'NOR', name: 'Norway', group: TeamGroup.H },
  { id: 'POL', name: 'Poland', group: TeamGroup.H },
  // Group I
  { id: 'RUS', name: 'Russia', group: TeamGroup.I },
  { id: 'CRO', name: 'Croatia', group: TeamGroup.I },
  { id: 'SRB', name: 'Serbia', group: TeamGroup.I },
  { id: 'SUI', name: 'Switzerland', group: TeamGroup.I },
  // Group J
  { id: 'TUR', name: 'Turkey', group: TeamGroup.J },
  { id: 'GRE', name: 'Greece', group: TeamGroup.J },
  { id: 'CZE', name: 'Czech Republic', group: TeamGroup.J },
  { id: 'AUT', name: 'Austria', group: TeamGroup.J },
  // Group K
  { id: 'IRN', name: 'Iran', group: TeamGroup.K },
  { id: 'SAU', name: 'Saudi Arabia', group: TeamGroup.K },
  { id: 'UAE', name: 'United Arab Emirates', group: TeamGroup.K },
  { id: 'QAT', name: 'Qatar', group: TeamGroup.K },
  // Group L
  { id: 'CRC', name: 'Costa Rica', group: TeamGroup.L },
  { id: 'PAN', name: 'Panama', group: TeamGroup.L },
  { id: 'HON', name: 'Honduras', group: TeamGroup.L },
  { id: 'SLV', name: 'El Salvador', group: TeamGroup.L },
];

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
    update: { isAdmin: true },
    create: {
      email: 'admin@example.com',
      displayName: 'Admin User',
      isAdmin: true,
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
    update: { role: LeagueRole.ADMIN },
    create: {
      leagueId: generalLeague.id,
      userId: adminUser.id,
      role: LeagueRole.ADMIN,
    },
  });
  console.log(`✅ Made ${adminUser.email} an ADMIN of ${generalLeague.name}`);

  // Seed teams
  console.log('📦 Seeding teams...');
  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {},
      create: team,
    });
  }
  console.log(`✅ Created ${teams.length} teams`);

  // Matches will be fetched/imported via admin API endpoints
  console.log(
    '📝 Note: Matches should be imported via POST /api/admin/matches'
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
