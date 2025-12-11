'use client';

import { useState } from 'react';
import { Creator } from '@/lib/types/discovery.types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SocialProofBadges } from './SocialProofBadges';
import { ChapterPreviewCarousel } from './ChapterPreviewCarousel';
import { SubscriptionTierCard } from './SubscriptionTierCard';
import { CheckCircle2, Share2, Heart } from 'lucide-react';
import Image from 'next/image';

interface CreatorPreviewModalProps {
    creator: Creator | null;
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: (creator: Creator) => void;
}

export function CreatorPreviewModal({
    creator,
    isOpen,
    onClose,
    onSubscribe,
}: CreatorPreviewModalProps) {
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);

    if (!creator) return null;

    const freeChapters = creator.chapters.filter((c) => c.isFree);
    const lockedChapters = creator.chapters.filter((c) => !c.isFree);

    const handleSubscribe = () => {
        onSubscribe(creator);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                {/* Hero Section */}
                <div className="relative -m-6 mb-6 h-64 overflow-hidden">
                    <Image
                        src={creator.coverImage}
                        alt={creator.displayName}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Creator Info Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20 border-4 border-white">
                                <AvatarImage src={creator.avatar} alt={creator.displayName} />
                                <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="text-white">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">@{creator.username}</h2>
                                    {creator.verified && (
                                        <CheckCircle2 className="h-6 w-6 text-blue-400" />
                                    )}
                                </div>
                                <p className="text-sm opacity-90">
                                    {creator.archetype} • {creator.location}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsFollowing(!isFollowing)}
                            >
                                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                                {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                            <Button variant="secondary" size="sm">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogHeader>
                    <DialogTitle className="sr-only">Creator Profile</DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="chapters">Chapters</TabsTrigger>
                        <TabsTrigger value="highlights">Highlights</TabsTrigger>
                        <TabsTrigger value="stats">Stats</TabsTrigger>
                    </TabsList>

                    {/* About Tab */}
                    <TabsContent value="about" className="space-y-6">
                        {/* Social Proof */}
                        <div>
                            <SocialProofBadges
                                subscriberCount={creator.subscriberCount}
                                rating={creator.rating}
                                reviewCount={creator.reviewCount}
                                trendingRank={creator.trendingRank}
                                isFeatured={creator.isFeatured}
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <h3 className="mb-2 text-lg font-semibold">About</h3>
                            <p className="leading-relaxed text-muted-foreground">{creator.bio}</p>
                        </div>

                        {/* Life Archetype */}
                        <div className="rounded-lg bg-gradient-to-r from-amber-50 to-teal-50 p-4">
                            <h3 className="mb-2 text-lg font-semibold">🎯 Life Archetype</h3>
                            <p className="font-medium text-gray-700">{creator.archetype}</p>
                            <p className="mt-1 text-sm text-gray-600">
                                People who take calculated steps toward their goals, building success through
                                consistent effort and strategic planning.
                            </p>
                        </div>

                        {/* Life Metrics */}
                        <div className="rounded-lg border bg-card p-4">
                            <h3 className="mb-3 text-lg font-semibold">📊 Life Metrics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Happiness</p>
                                    <p className="text-2xl font-bold">{creator.metrics.happiness}/10</p>
                                    <p className="text-xs text-muted-foreground">Top 15%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Career Progress</p>
                                    <p className="text-2xl font-bold">{creator.metrics.careerPercentile}th</p>
                                    <p className="text-xs text-muted-foreground">percentile</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">Authenticity Score</p>
                                    <p className="text-2xl font-bold">{creator.metrics.authenticityScore}%</p>
                                </div>
                            </div>
                        </div>

                        {/* AI Prediction */}
                        {creator.metrics.prediction && (
                            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-purple-900">
                                    🔮 AI Prediction
                                </h3>
                                <p className="font-medium italic text-purple-800">
                                    &quot;{creator.metrics.prediction}&quot;
                                </p>
                                {creator.metrics.predictionConfidence && (
                                    <p className="mt-2 text-sm text-purple-700">
                                        Confidence: {creator.metrics.predictionConfidence}%
                                    </p>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    {/* Chapters Tab */}
                    <TabsContent value="chapters" className="space-y-6">
                        {/* Free Chapters */}
                        <div>
                            <h3 className="mb-3 text-lg font-semibold">
                                📖 Free Chapters ({freeChapters.length})
                            </h3>
                            <ChapterPreviewCarousel
                                chapters={freeChapters}
                                maxVisible={6}
                                onChapterClick={(chapter) => console.log('View chapter:', chapter.id)}
                            />
                        </div>

                        {/* Locked Chapters */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                                🔒 Premium Chapters ({lockedChapters.length})
                            </h3>
                            <p className="mb-3 text-sm text-muted-foreground">
                                Subscribe to unlock all premium content
                            </p>
                            <ChapterPreviewCarousel
                                chapters={lockedChapters}
                                maxVisible={6}
                                onChapterClick={(chapter) => console.log('Subscribe for chapter:', chapter.id)}
                            />
                        </div>
                    </TabsContent>

                    {/* Highlights Tab */}
                    <TabsContent value="highlights" className="space-y-4">
                        <p className="text-muted-foreground">
                            Key moments and highlights from this creator&apos;s journey will appear here.
                        </p>
                    </TabsContent>

                    {/* Stats Tab */}
                    <TabsContent value="stats" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-sm text-muted-foreground">Total Chapters</p>
                                <p className="text-3xl font-bold">{creator.chapters.length}</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-sm text-muted-foreground">Subscribers</p>
                                <p className="text-3xl font-bold">{creator.subscriberCount.toLocaleString()}</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-sm text-muted-foreground">Rating</p>
                                <p className="text-3xl font-bold">{creator.rating}/5</p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <p className="text-sm text-muted-foreground">Reviews</p>
                                <p className="text-3xl font-bold">{creator.reviewCount}</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Subscription Tiers */}
                <div className="mt-6 space-y-4">
                    <h3 className="text-xl font-semibold">💎 Choose Your Access</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {creator.tiers.map((tier) => (
                            <SubscriptionTierCard
                                key={tier.id}
                                tier={tier}
                                onSelect={(t) => setSelectedTier(t.id)}
                                isSelected={selectedTier === tier.id}
                            />
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-6 flex items-center justify-between rounded-lg bg-gradient-to-r from-teal-50 to-amber-50 p-4">
                    <div>
                        <p className="font-semibold">Start Free Trial - 7 Days</p>
                        <p className="text-sm text-muted-foreground">
                            Then ${creator.tiers[1]?.price || 19.99}/mo • Cancel anytime
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="bg-[#008B8B] hover:bg-[#006B6B]"
                        onClick={handleSubscribe}
                    >
                        Start Free Trial
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
