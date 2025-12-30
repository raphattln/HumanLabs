import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
    // First milestone
    {
        code: 'first_game',
        name: 'First Steps',
        description: 'Played your first game',
        icon: '🎮',
        category: 'milestone',
    },

    // Session milestones
    {
        code: 'sessions_10',
        name: 'Getting Started',
        description: 'Completed 10 games',
        icon: '🌱',
        category: 'milestone',
    },
    {
        code: 'sessions_50',
        name: 'Making Progress',
        description: 'Completed 50 games',
        icon: '🚀',
        category: 'milestone',
    },
    {
        code: 'sessions_200',
        name: 'Dedicated',
        description: 'Completed 200 games',
        icon: '⭐',
        category: 'milestone',
    },

    // Consistency/Streak badges
    {
        code: 'streak_3',
        name: 'Building Momentum',
        description: 'Played 3 days in a row',
        icon: '🔥',
        category: 'consistency',
    },
    {
        code: 'streak_7',
        name: 'Week Warrior',
        description: 'Played 7 days in a row',
        icon: '🔥',
        category: 'consistency',
    },
    {
        code: 'streak_14',
        name: 'Two Week Streak',
        description: 'Played 14 days in a row',
        icon: '🏆',
        category: 'consistency',
    },

    // Exploration
    {
        code: 'tried_all_games',
        name: 'Complete Explorer',
        description: 'Tried all 11 games',
        icon: '🎯',
        category: 'exploration',
    },
];

async function main() {
    console.log('Seeding badges...');

    // Delete existing badges first to ensure clean slate
    await prisma.badge.deleteMany({});

    for (const badge of badges) {
        await prisma.badge.create({
            data: badge,
        });
        console.log(`✓ ${badge.name}`);
    }

    console.log(`\nSeeded ${badges.length} badges successfully!`);
}

main()
    .catch((e) => {
        console.error('Error seeding badges:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
