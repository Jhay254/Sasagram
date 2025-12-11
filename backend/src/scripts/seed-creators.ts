import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedCreators() {
    console.log('🌱 Seeding creators for discovery feed...');

    // Create test creators
    const creators = [
        {
            email: 'sarah@sasagram.com',
            password: await bcrypt.hash('password123', 10),
            name: 'Sarah Johnson',
            role: UserRole.CREATOR,
            username: 'sarahjohnson',
            displayName: 'Sarah Johnson',
            bio: 'From corporate burnout to 7-figure founder. My 3-year journey of building a SaaS company while raising twins. Real talk: the highs, lows, and everything in between.',
            archetype: 'The Steady Climber',
            location: 'New York, NY',
            coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop',
            profileVideo: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
            subscriberCount: 2345,
            avgRating: 4.9,
            reviewCount: 234,
            trendingScore: 92,
            isFeatured: true,
            categories: ['career-business', 'personal-growth'],
            urgencyOffer: {
                type: 'limited-time',
                message: '🔥 50% off first month - Limited time offer!',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
        },
        {
            email: 'mika@sasagram.com',
            password: await bcrypt.hash('password123', 10),
            name: 'Mika Chen',
            role: UserRole.CREATOR,
            username: 'mikaartist',
            displayName: 'Mika Chen',
            bio: "Started painting at 40. Now in MOMA. The journey from corporate lawyer to full-time artist. Proving it's never too late to follow your passion.",
            archetype: 'The Late Bloomer',
            location: 'Brooklyn, NY',
            coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=450&fit=crop',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
            subscriberCount: 1823,
            avgRating: 4.8,
            reviewCount: 156,
            trendingScore: 78,
            isFeatured: false,
            categories: ['creative-arts', 'personal-growth'],
        },
        {
            email: 'john@sasagram.com',
            password: await bcrypt.hash('password123', 10),
            name: 'John Martinez',
            role: UserRole.CREATOR,
            username: 'fitjohn',
            displayName: 'John Martinez',
            bio: "From 300lbs to Ironman finisher. The physical and mental transformation you won't see on Instagram. Real struggles, real victories.",
            archetype: 'The Transformer',
            location: 'Austin, TX',
            coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop',
            avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
            subscriberCount: 2567,
            avgRating: 4.9,
            reviewCount: 312,
            trendingScore: 95,
            isFeatured: true,
            categories: ['health-fitness', 'personal-growth'],
            urgencyOffer: {
                type: 'limited-spots',
                message: '⚡ Only 3 spots left at this price!',
            },
        },
    ];

    for (const creatorData of creators) {
        try {
            // Check if creator already exists
            const existing = await prisma.user.findUnique({
                where: { email: creatorData.email },
            });

            if (existing) {
                console.log(`⏭️  Skipping ${creatorData.username} - already exists`);
                continue;
            }

            // Create creator
            const creator = await prisma.user.create({
                data: creatorData,
            });

            console.log(`✅ Created creator: ${creator.username}`);

            // Create sample chapters for each creator
            await prisma.livingChapter.create({
                data: {
                    userId: creator.id,
                    title: 'Chapter 1: The Beginning',
                    content: 'This is where it all started...',
                    status: 'active',
                    startDate: new Date(),
                    subscriberCount: Math.floor(Math.random() * 100),
                },
            });

            // Create subscription tiers
            await prisma.subscriptionTier.createMany({
                data: [
                    {
                        creatorId: creator.id,
                        name: 'Basic',
                        price: 9.99,
                        features: JSON.stringify(['All chapters', 'Community access']),
                        isActive: true,
                    },
                    {
                        creatorId: creator.id,
                        name: 'Plus',
                        price: 19.99,
                        features: JSON.stringify(['All chapters', 'Predictions', 'Stats', 'Priority support']),
                        isActive: true,
                    },
                    {
                        creatorId: creator.id,
                        name: 'Vision',
                        price: 49.99,
                        features: JSON.stringify(['All chapters', 'Predictions', 'Stats', 'Shadow Self', 'AI Q&A', '1-on-1 calls']),
                        isActive: true,
                    },
                ],
            });

            console.log(`  ├─ Created chapters and tiers for ${creator.username}`);
        } catch (error) {
            console.error(`❌ Error creating ${creatorData.username}:`, error);
        }
    }

    console.log('\n✅ Seeding complete!');
}

seedCreators()
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
