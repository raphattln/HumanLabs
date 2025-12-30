
import { PrismaClient, ScoreDirection } from '@prisma/client';
// We need to define GameConfig here since we cannot import from src in seed easily without ts-node setup complications usually
// Or we can assume ts-node is working. Let's try to duplicate constants to be safe and standalone.

const prisma = new PrismaClient();

const GAMES = [
    { slug: "reaction-time", name: "Reaction Time", scoreDirection: "LOWER_BETTER" },
    { slug: "aim-trainer", name: "Aim Trainer", scoreDirection: "LOWER_BETTER" },
    { slug: "sequence-memory", name: "Sequence Memory", scoreDirection: "HIGHER_BETTER" },
    { slug: "visual-memory", name: "Visual Memory", scoreDirection: "HIGHER_BETTER" },
    { slug: "number-memory", name: "Number Memory", scoreDirection: "HIGHER_BETTER" },
    { slug: "verbal-memory", name: "Verbal Memory", scoreDirection: "HIGHER_BETTER" },
    { slug: "chimp-test", name: "Chimp Test", scoreDirection: "HIGHER_BETTER" },
    { slug: "typing-test", name: "Typing Test", scoreDirection: "HIGHER_BETTER" },
    { slug: "go-no-go", name: "Go / No-Go", scoreDirection: "HIGHER_BETTER" },
    { slug: "stroop-test", name: "Stroop Test", scoreDirection: "HIGHER_BETTER" },
    { slug: "time-estimation", name: "Time Estimation", scoreDirection: "HIGHER_BETTER" },
];

const BADGES = [
    // Milestones
    { code: 'first_game', name: 'First Steps', description: 'Played your first game', category: 'milestone', icon: '🐣' },
    { code: 'sessions_10', name: 'Dedicated', description: 'Complete 10 sessions', category: 'milestone', icon: '🔟' },
    { code: 'sessions_50', name: 'Regular', description: 'Complete 50 sessions', category: 'milestone', icon: '📅' },
    { code: 'sessions_200', name: 'Veteran', description: 'Complete 200 sessions', category: 'milestone', icon: '🎓' },

    // Consistency
    { code: 'streak_3', name: 'Warming Up', description: '3 day streak', category: 'consistency', icon: '🔥' },
    { code: 'streak_7', name: 'On Fire', description: '7 day streak', category: 'consistency', icon: '🔥🔥' },
    { code: 'streak_14', name: 'Unstoppable', description: '14 day streak', category: 'consistency', icon: '🚀' },

    // Exploration
    { code: 'tried_all_games', name: 'All Rounder', description: 'Play every game at least once', category: 'exploration', icon: '🌟' },

    // Game specific (examples)
    { code: 'game_master_reaction-time', name: 'Reflex Master', description: '100 plays on Reaction Time', category: 'mastery', icon: '⚡' },
    { code: 'game_master_sequence-memory', name: 'Memory King', description: '100 plays on Sequence Memory', category: 'mastery', icon: '🧠' },
];

async function main() {
    console.log('🌱 Starting seed...');

    // Seed Games
    console.log('Syncing Games...');
    for (const game of GAMES) {
        await prisma.game.upsert({
            where: { slug: game.slug },
            update: {
                name: game.name,
                scoreDirection: game.scoreDirection as ScoreDirection,
            },
            create: {
                slug: game.slug,
                name: game.name,
                scoreDirection: game.scoreDirection as ScoreDirection,
            },
        });
    }

    // Seed Badges
    console.log('Syncing Badges...');
    for (const badge of BADGES) {
        await prisma.badge.upsert({
            where: { code: badge.code },
            update: {
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                category: badge.category,
            },
            create: {
                code: badge.code,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                category: badge.category,
            },
        });
    }

    console.log('✅ Seed complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
