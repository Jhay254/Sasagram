'use client';

import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, CheckCircle2 } from 'lucide-react';

interface SocialProofBadgesProps {
    subscriberCount: number;
    rating?: number;
    reviewCount?: number;
    trendingRank?: number;
    isFeatured?: boolean;
}

export function SocialProofBadges({
    subscriberCount,
    rating,
    reviewCount,
    trendingRank,
    isFeatured,
}: SocialProofBadgesProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Subscriber Count */}
            <Badge variant="secondary" className="gap-1">
                <span className="text-lg">👥</span>
                <span className="font-semibold">{subscriberCount.toLocaleString()}</span>
                <span className="text-muted-foreground">subscribers</span>
            </Badge>

            {/* Star Rating */}
            {rating && reviewCount && (
                <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{rating.toFixed(1)}/5</span>
                    <span className="text-muted-foreground">({reviewCount} reviews)</span>
                </Badge>
            )}

            {/* Trending Rank */}
            {trendingRank && trendingRank <= 10 && (
                <Badge className="gap-1 bg-gradient-to-r from-orange-500 to-red-500">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-semibold">Trending #{trendingRank}</span>
                </Badge>
            )}

            {/* Featured Badge */}
            {isFeatured && (
                <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Award className="h-3 w-3" />
                    <span className="font-semibold">Featured by Sasagram</span>
                </Badge>
            )}

            {/* Verified Badge (always shown if we have data) */}
            {subscriberCount > 1000 && (
                <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="font-semibold">Verified Creator</span>
                </Badge>
            )}
        </div>
    );
}
