import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
    // Content Creation Achievements
    {
        title: 'First Steps',
        description: 'Create your first memory entry',
        icon: '🌱',
        points: 10,
        category: 'content',
        triggerType: 'post_count',
        threshold: 1,
    },
    {
        title: 'Getting Started',
        description: 'Create 10 memory entries',
        icon: '📝',
        points: 25,
        category: 'content',
        triggerType: 'post_count',
        threshold: 10,
    },
    {
        title: 'Memory Keeper',
        description: 'Create 50 memory entries',
        icon: '📚',
        points: 50,
        category: 'content',
        triggerType: 'post_count',
        threshold: 50,
    },
    {
        title: 'Chronicler',
        description: 'Create 100 memory entries',
        icon: '✍️',
        points: 100,
        category: 'content',
        triggerType: 'post_count',
        threshold: 100,
    },
    {
        title: 'Life Historian',
        description: 'Create 500 memory entries',
        icon: '📖',
        points: 250,
        category: 'content',
        triggerType: 'post_count',
        threshold: 500,
    },

    // Social/Network Achievements
    {
        title: 'Connector',
        description: 'Make your first connection',
        icon: '🤝',
        points: 15,
        category: 'social',
        triggerType: 'connection_count',
        threshold: 1,
    },
    {
        title: 'Networker',
        description: 'Connect with 5 people',
        icon: '👥',
        points: 30,
        category: 'social',
        triggerType: 'connection_count',
        threshold: 5,
    },
    {
        title: 'Community Builder',
        description: 'Connect with 20 people',
        icon: '🌐',
        points: 75,
        category: 'social',
        triggerType: 'connection_count',
        threshold: 20,
    },
    {
        title: 'Tagger',
        description: 'Tag someone in a memory',
        icon: '🏷️',
        points: 10,
        category: 'social',
        triggerType: 'tag_count',
        threshold: 1,
    },
    {
        title: 'Memory Sharer',
        description: 'Tag 10 people in memories',
        icon: '🎯',
        points: 40,
        category: 'social',
        triggerType: 'tag_count',
        threshold: 10,
    },

    // Referral Achievements
    {
        title: 'Inviter',
        description: 'Invite your first friend',
        icon: '💌',
        points: 20,
        category: 'social',
        triggerType: 'referral_count',
        threshold: 1,
    },
    {
        title: 'Ambassador',
        description: 'Invite 5 friends',
        icon: '🎖️',
        points: 50,
        category: 'social',
        triggerType: 'referral_count',
        threshold: 5,
    },
    {
        title: 'Evangelist',
        description: 'Invite 10 friends',
        icon: '🏆',
        points: 100,
        category: 'social',
        triggerType: 'referral_count',
        threshold: 10,
    },

    // Streak Achievements
    {
        title: 'Consistent',
        description: 'Post for 3 days in a row',
        icon: '🔥',
        points: 15,
        category: 'streak',
        triggerType: 'streak_days',
        threshold: 3,
    },
    {
        title: 'Dedicated',
        description: 'Post for 7 days in a row',
        icon: '⚡',
        points: 35,
        category: 'streak',
        triggerType: 'streak_days',
        threshold: 7,
    },
    {
        title: 'Committed',
        description: 'Post for 30 days in a row',
        icon: '💪',
        points: 100,
        category: 'streak',
        triggerType: 'streak_days',
        threshold: 30,
    },
    {
        title: 'Unstoppable',
        description: 'Post for 100 days in a row',
        icon: '🌟',
        points: 300,
        category: 'streak',
        triggerType: 'streak_days',
        threshold: 100,
    },

    // Legacy Achievements
    {
        title: 'Time Traveler',
        description: 'Use the Rewind feature',
        icon: '⏰',
        points: 10,
        category: 'legacy',
        triggerType: 'rewind_usage',
        threshold: 1,
    },
    {
        title: 'Chapter Author',
        description: 'Complete your first Living Chapter',
        icon: '📘',
        points: 50,
        category: 'legacy',
        triggerType: 'chapter_complete',
        threshold: 1,
    },
    {
        title: 'Story Weaver',
        description: 'Create a Story Merger',
        icon: '🧵',
        points: 40,
        category: 'legacy',
        triggerType: 'merger_count',
        threshold: 1,
    },
    {
        title: 'Collaborator',
        description: 'Participate in 5 Story Mergers',
        icon: '🤲',
        points: 100,
        category: 'legacy',
        triggerType: 'merger_count',
        threshold: 5,
    },
];

async function main() {
    console.log('🌱 Seeding achievements...');

    for (const achievement of achievements) {
        // Check if achievement already exists
        const existing = await prisma.achievement.findFirst({
            where: { title: achievement.title },
        });

        if (existing) {
            // Update existing
            await prisma.achievement.update({
                where: { id: existing.id },
                data: achievement,
            });
            console.log(`✅ Updated: ${achievement.title}`);
        } else {
            // Create new
            await prisma.achievement.create({
                data: achievement,
            });
            console.log(`✅ Created: ${achievement.title}`);
        }
    }

    console.log(`\n🎉 Successfully seeded ${achievements.length} achievements!`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding achievements:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
