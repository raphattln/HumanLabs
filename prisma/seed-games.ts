import { PrismaClient, ScoreDirection } from '@prisma/client';

const prisma = new PrismaClient();

const games = [
    {
        slug: 'reaction-time',
        name: 'Reaction Time',
        description: 'Test your visual reflexes',
        scoreDirection: ScoreDirection.LOWER_BETTER,
        scoreUnit: 'ms',
        isActive: true,
    },
    {
        slug: 'aim-trainer',
        name: 'Aim Trainer',
        description: 'Click targets as fast as possible',
        scoreDirection: ScoreDirection.LOWER_BETTER,
        scoreUnit: 'ms',
        isActive: true,
    },
    {
        slug: 'sequence-memory',
        name: 'Sequence Memory',
        description: 'Remember increasingly long patterns',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'level',
        isActive: true,
    },
    {
        slug: 'visual-memory',
        name: 'Visual Memory',
        description: 'Remember the positions of squares',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'level',
        isActive: true,
    },
    {
        slug: 'number-memory',
        name: 'Number Memory',
        description: 'Memorize the longest number',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'digits',
        isActive: true,
    },
    {
        slug: 'verbal-memory',
        name: 'Verbal Memory',
        description: 'Keep as many words in memory as possible',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'score',
        isActive: true,
    },
    {
        slug: 'chimp-test',
        name: 'Chimp Test',
        description: 'Test your working memory',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'numbers',
        isActive: true,
    },
    {
        slug: 'typing-test',
        name: 'Typing Test',
        description: 'How many words per minute?',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'wpm',
        isActive: true,
    },
    {
        slug: 'go-no-go',
        name: 'Go / No-Go',
        description: 'Test your impulse control',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'score',
        isActive: true,
    },
    {
        slug: 'stroop-test',
        name: 'Stroop Test',
        description: 'Test your attention control',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'score',
        isActive: true,
    },
    {
        slug: 'time-estimation',
        name: 'Time Estimation',
        description: 'How accurate is your internal clock?',
        scoreDirection: ScoreDirection.HIGHER_BETTER,
        scoreUnit: 'score',
        isActive: true,
    },
];

async function main() {
    console.log('Seeding games...');

    // Delete existing games first to ensure clean slate
    await prisma.game.deleteMany({});

    for (const game of games) {
        await prisma.game.create({
            data: game,
        });
        console.log(`✓ ${game.name} (${game.scoreDirection})`);
    }

    console.log(`\nSeeded ${games.length} games successfully!`);
}

main()
    .catch((e) => {
        console.error('Error seeding games:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
