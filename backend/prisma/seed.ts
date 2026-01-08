import { LeagueRole, Outcome, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { teams, matches } from './data';

const prisma = new PrismaClient();

// Fake users for testing
const fakeUsers = [
  { email: 'player1@test.com', displayName: 'שחקן א', nickname: 'שחקן א' },
  { email: 'player2@test.com', displayName: 'שחקן ב', nickname: 'שחקן ב' },
  { email: 'player3@test.com', displayName: 'שחקן ג', nickname: 'שחקן ג' },
  { email: 'player4@test.com', displayName: 'שחקן ד', nickname: 'שחקן ד' },
  { email: 'player5@test.com', displayName: 'שחקן ה', nickname: 'שחקן ה' },
];

// Random top scorers for fake forms
const topScorers = [
  'Kylian Mbappé',
  'Erling Haaland',
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Harry Kane',
];

// Generate random score (0-4)
function randomScore(): number {
  return Math.floor(Math.random() * 5);
}

// Calculate outcome based on scores
function getOutcome(scoreA: number, scoreB: number): Outcome {
  if (scoreA > scoreB) return Outcome.W;
  if (scoreA < scoreB) return Outcome.L;
  return Outcome.D;
}

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
      joinCode: randomBytes(4).toString('hex'),
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
  const createdTeams: Record<string, string> = {}; // fifaCode -> teamId
  
  for (const team of teams) {
    // Check if team exists
    let createdTeam = await prisma.team.findFirst({
      where: { fifaCode: team.fifaCode },
    });
    
    if (!createdTeam) {
      createdTeam = await prisma.team.create({
        data: {
          fifaCode: team.fifaCode,
          name: team.name,
          groupLetter: team.groupLetter,
          groupPosition: team.groupPosition,
        },
      });
    }
    
    createdTeams[team.fifaCode] = createdTeam.id;
  }
  console.log(`✅ Created ${teams.length} teams`);

  // Initialize group standings and link teams
  console.log('📊 Initializing group standings...');
  const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  let standingsCount = 0;
  
  for (const groupLetter of groupLetters) {
    // Get teams in this group
    const groupTeams = teams.filter((t) => t.groupLetter === groupLetter);
    
    for (let position = 1; position <= 4; position++) {
      // Find team with this initial position
      const teamInPosition = groupTeams.find((t) => t.groupPosition === position);
      const teamId = teamInPosition ? createdTeams[teamInPosition.fifaCode] : null;
      
      const existing = await prisma.groupStanding.findFirst({
        where: { groupLetter, position },
      });
      
      if (!existing) {
        await prisma.groupStanding.create({
          data: {
            groupLetter,
            position,
            teamId: teamId || null, // Link team by initial seeding position
          },
        });
      }
      standingsCount++;
    }
  }
  console.log(`✅ Created ${standingsCount} group standings (linked to teams)`);

  // Initialize third place rankings (for the 8 best 3rd place teams)
  console.log('🥉 Initializing third place rankings...');
  // We'll create placeholders for all 12 groups, but only 8 will advance
  for (const groupLetter of groupLetters) {
    const existing = await prisma.thirdPlaceRanking.findFirst({
      where: { groupLetter },
    });
    
    if (!existing) {
      await prisma.thirdPlaceRanking.create({
        data: {
          groupLetter,
          teamId: null,
          rank: null, // Will be calculated after group stage
        },
      });
    }
  }
  console.log(`✅ Created ${groupLetters.length} third place ranking placeholders`);

  // Seed matches
  console.log('📦 Seeding matches...');
  for (const match of matches) {
    // For group stage matches, resolve team1Id and team2Id
    let team1Id: string | undefined;
    let team2Id: string | undefined;
    
    if (match.stage === 'GROUP') {
      // Parse codes like 'A1', 'B2'
      if (/^[A-L][1-4]$/.test(match.team1Code)) {
        const groupLetter = match.team1Code[0];
        const position = parseInt(match.team1Code[1]!);
        const team = teams.find((t) => t.groupLetter === groupLetter && t.groupPosition === position);
        if (team) team1Id = createdTeams[team.fifaCode];
      }
      
      if (/^[A-L][1-4]$/.test(match.team2Code)) {
        const groupLetter = match.team2Code[0];
        const position = parseInt(match.team2Code[1]!);
        const team = teams.find((t) => t.groupLetter === groupLetter && t.groupPosition === position);
        if (team) team2Id = createdTeams[team.fifaCode];
      }
    }
    
    const existingMatch = await prisma.match.findFirst({
      where: { matchNumber: match.matchNumber },
    });
    
    if (!existingMatch) {
      await prisma.match.create({
        data: {
          matchNumber: match.matchNumber,
          stage: match.stage,
          team1Code: match.team1Code,
          team2Code: match.team2Code,
          team1Name: match.team1Name,
          team2Name: match.team2Name,
          team1Id: team1Id || null,
          team2Id: team2Id || null,
          scheduledAt: match.scheduledAt,
          venue: match.venue,
        },
      });
    }
  }
  console.log(`✅ Created ${matches.length} matches (group stage teams linked)`);

  // Seed fake users with forms for testing
  console.log('👥 Creating fake users and forms for testing...');
  
  // Get all match IDs
  const allMatches = await prisma.match.findMany({
    select: { id: true, matchNumber: true },
    orderBy: { matchNumber: 'asc' },
  });
  
  for (let i = 0; i < fakeUsers.length; i++) {
    const fakeUser = fakeUsers[i]!;
    
    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: fakeUser.email },
      update: { displayName: fakeUser.displayName },
      create: {
        email: fakeUser.email,
        displayName: fakeUser.displayName,
      },
    });
    
    // Add user to General league
    await prisma.leagueMember.upsert({
      where: {
        leagueId_userId: {
          leagueId: generalLeague.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        leagueId: generalLeague.id,
        userId: user.id,
        role: LeagueRole.PLAYER,
      },
    });
    
    // Create form for user
    const form = await prisma.form.upsert({
      where: { ownerId: user.id },
      update: { nickname: fakeUser.nickname },
      create: {
        ownerId: user.id,
        nickname: fakeUser.nickname,
        submittedAt: new Date(),
        isFinal: true,
      },
    });
    
    // Create match picks for all 104 matches
    for (const match of allMatches) {
      const predScoreA = randomScore();
      const predScoreB = randomScore();
      const predOutcome = getOutcome(predScoreA, predScoreB);
      
      await prisma.matchPick.upsert({
        where: {
          formId_matchId: {
            formId: form.id,
            matchId: match.id,
          },
        },
        update: {
          predScoreA,
          predScoreB,
          predOutcome,
        },
        create: {
          formId: form.id,
          matchId: match.id,
          predScoreA,
          predScoreB,
          predOutcome,
        },
      });
    }
    
    // Create top scorer pick
    await prisma.topScorerPick.upsert({
      where: { formId: form.id },
      update: { playerName: topScorers[i]! },
      create: {
        formId: form.id,
        playerName: topScorers[i]!,
      },
    });
    
    console.log(`   ✅ Created form for ${fakeUser.displayName} with ${allMatches.length} match picks`);
  }
  
  console.log(`✅ Created ${fakeUsers.length} fake users with forms`);

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Summary:');
  console.log(`   - ${teams.length} teams`);
  console.log(`   - ${standingsCount} group standings`);
  console.log(`   - ${groupLetters.length} third place rankings`);
  console.log(`   - ${matches.length} matches`);
  console.log(`   - ${fakeUsers.length} fake users with forms (${allMatches.length} picks each)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
