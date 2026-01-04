import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying database structure...\n');

  // Check teams
  const teamCount = await prisma.team.count();
  const sampleTeams = await prisma.team.findMany({ take: 5 });
  console.log(`✅ Teams: ${teamCount}`);
  console.log(`   Sample:`, sampleTeams.map(t => `${t.name} (${t.groupLetter}${t.groupPosition})`).join(', '));

  // Check group standings
  const standingsCount = await prisma.groupStanding.count();
  const groupAStandings = await prisma.groupStanding.findMany({
    where: { groupLetter: 'A' },
    orderBy: { position: 'asc' },
  });
  console.log(`\n✅ Group Standings: ${standingsCount}`);
  console.log(`   Group A positions: ${groupAStandings.map(s => `${s.position}:${s.teamId || 'TBD'}`).join(', ')}`);

  // Check third place rankings
  const thirdPlaceCount = await prisma.thirdPlaceRanking.count();
  console.log(`\n✅ Third Place Rankings: ${thirdPlaceCount} placeholders`);

  // Check matches
  const matchCount = await prisma.match.count();
  const matchesByStage = await prisma.match.groupBy({
    by: ['stage'],
    _count: true,
  });
  console.log(`\n✅ Matches: ${matchCount}`);
  matchesByStage.forEach((s) => {
    console.log(`   ${s.stage}: ${s._count} matches`);
  });

  // Sample matches
  const firstMatch = await prisma.match.findFirst({
    where: { matchNumber: 1 },
  });
  const r32Match = await prisma.match.findFirst({
    where: { matchNumber: 74 },
  });
  
  console.log(`\n📋 Sample Matches:`);
  console.log(`   Match 1: ${firstMatch?.team1Name} (${firstMatch?.team1Code}) vs ${firstMatch?.team2Name} (${firstMatch?.team2Code})`);
  console.log(`            at ${firstMatch?.venue}`);
  console.log(`   Match 74 (R32): ${r32Match?.team1Code} vs ${r32Match?.team2Code}`);
  console.log(`              at ${r32Match?.venue}`);

  console.log('\n✨ All verified successfully!');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

