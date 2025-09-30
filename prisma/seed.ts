import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🎪 Starting database seed...');

  // Create arenas
  const arena1 = await prisma.arena.upsert({
    where: { name: 'Tightrope Walkway' },
    update: {},
    create: {
      name: 'Tightrope Walkway',
      difficulty: 1,
      description: 'A gentle introduction to circus racing. Balance on the tightrope and reach the finish!',
      unlockAfter: null,
    },
  });

  const arena2 = await prisma.arena.upsert({
    where: { name: 'Clown Alley' },
    update: {},
    create: {
      name: 'Clown Alley',
      difficulty: 2,
      description: 'Navigate through the chaotic clown alley with moving platforms and obstacles!',
      unlockAfter: arena1.id,
    },
  });

  const arena3 = await prisma.arena.upsert({
    where: { name: 'Juggling Tunnel' },
    update: {},
    create: {
      name: 'Juggling Tunnel',
      difficulty: 3,
      description: 'The ultimate challenge! Precise jumps and perfect timing required.',
      unlockAfter: arena2.id,
    },
  });

  console.log('✅ Created arenas:');
  console.log(`  - ${arena1.name} (Easy)`);
  console.log(`  - ${arena2.name} (Medium)`);
  console.log(`  - ${arena3.name} (Hard)`);
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
