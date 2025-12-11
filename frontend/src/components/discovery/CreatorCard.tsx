'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Creator } from '@/lib/types/discovery.types';
import { useViewportVideo } from '@/lib/hooks/useViewportVideo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SocialProofBadges } from './SocialProofBadges';
import { ChapterPreviewCarousel } from './ChapterPreviewCarousel';
import { UrgencyBanner } from './UrgencyBanner';
import { CheckCircle2, Heart, MessageCircle, Share2, Play, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreatorCardProps {
    creator: Creator;
    onPreview: (creator: Creator) => void;
    onSubscribe: (creator: Creator) => void;
}

export function CreatorCard({ creator, onPreview, onSubscribe }: CreatorCardProps) {
    const { videoRef, isPlaying, isMuted, togglePlay, toggleMute } = useViewportVideo({
        threshold: 0.5,
        autoPlay: true,
        muted: true,
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [likes, setLikes] = useState(234);
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
    };

    const truncatedBio = creator.bio.slice(0, 150);
    const needsTruncation = creator.bio.length > 150;

    return (
        <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
            <CardContent className="p-0">
                {/* Hero Image/Video Section */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                    {creator.previewVideo ? (
                        <>
                            <video
                                ref={videoRef}
                                src={creator.previewVideo}
                                playsInline
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-4 right-4 flex gap-3">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 transition-transform"
                                    onClick={togglePlay}
                                >
                                    {isPlaying ? (
                                        <div className="h-3 w-3 border-2 border-white" />
                                    ) : (
                                        <Play className="h-5 w-5 text-white ml-0.5" />
                                    )}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 transition-transform"
                                    onClick={toggleMute}
                                >
                                    {isMuted ? (
                                        <VolumeX className="h-5 w-5 text-white" />
                                    ) : (
                                        <Volume2 className="h-5 w-5 text-white" />
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Image
                            src={creator.coverImage}
                            alt={`${creator.displayName}'s story`}
                            fill
                            sizes="(max-width: 768px) 100vw, 768px"
                            className="object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                        <div className="flex items-center gap-2 text-sm">
                            <Play className="h-4 w-4" />
                            <span className="font-medium">Preview: My Journey</span>
                        </div>
                    </div>
                </div>

                {/* Creator Info Section */}
                <div className="p-4 sm:p-6">
                    <div className="mb-4 flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={creator.avatar} alt={creator.displayName} />
                            <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold">@{creator.username}</h3>
                                {creator.verified && (
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {creator.archetype} • {creator.location}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {creator.subscriberCount.toLocaleString()} subscribers
                            </p>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                        <p className="text-base leading-relaxed text-foreground">
                            {isExpanded ? creator.bio : truncatedBio}
                            {needsTruncation && !isExpanded && '...'}
                        </p>
                        {needsTruncation && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-1 text-sm font-medium text-[#008B8B] hover:underline"
                            >
                                {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                        )}
                    </div>

                    {/* Urgency Banner */}
                    {creator.urgencyOffer && (
                        <div className="mb-4">
                            <UrgencyBanner offer={creator.urgencyOffer} />
                        </div>
                    )}

                    {/* Life Metrics Teaser */}
                    <div className="mb-4 rounded-lg bg-gradient-to-r from-amber-50 to-teal-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-gray-700">📊 Life Metrics</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">😊 Happiness:</span>{' '}
                                <span className="font-semibold">{creator.metrics.happiness}/10</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">💼 Career:</span>{' '}
                                <span className="font-semibold">{creator.metrics.careerPercentile}th %ile</span>
                            </div>
                        </div>
                        {creator.metrics.prediction && (
                            <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">🔮 Next:</span>{' '}
                                <span className="font-medium italic">&quot;{creator.metrics.prediction}&quot;</span>
                            </div>
                        )}
                    </div>

                    {/* Social Proof Badges */}
                    <div className="mb-4">
                        <SocialProofBadges
                            subscriberCount={creator.subscriberCount}
                            rating={creator.rating}
                            reviewCount={creator.reviewCount}
                            trendingRank={creator.trendingRank}
                            isFeatured={creator.isFeatured}
                        />
                    </div>

                    {/* Preview Chapters */}
                    <div className="mb-4">
                        <h4 className="mb-2 text-sm font-semibold">Preview Chapters</h4>
                        <ChapterPreviewCarousel
                            chapters={creator.chapters}
                            maxVisible={3}
                            onChapterClick={() => onPreview(creator)}
                        />
                    </div>

                    {/* Subscription Tiers */}
                    <div className="mb-4 rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between text-sm">
                            {creator.tiers.map((tier) => (
                                <div key={tier.id} className="text-center">
                                    <p className="font-semibold">{tier.name}</p>
                                    <p className="text-xs text-muted-foreground">${tier.price}/mo</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="mb-4 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onPreview(creator)}
                        >
                            Preview Free Chapters
                        </Button>
                        <Button
                            className="flex-1 bg-[#008B8B] hover:bg-[#006B6B]"
                            onClick={() => onSubscribe(creator)}
                        >
                            Subscribe - ${creator.tiers[1]?.price || 19.99}/mo
                        </Button>
                    </div>

                    {/* Social Proof */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-1 transition-colors hover:text-red-500"
                        >
                            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{likes}</span>
                        </button>
                        <button className="flex items-center gap-1 transition-colors hover:text-blue-500">
                            <MessageCircle className="h-4 w-4" />
                            <span>56</span>
                        </button>
                        <button className="flex items-center gap-1 transition-colors hover:text-green-500">
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                        </button>
                    </div>
                </div>
            </CardContent >
        </Card >
    );
}
