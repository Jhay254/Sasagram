'use client';

import { SubscriptionTier } from '@/lib/types/discovery.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface SubscriptionTierCardProps {
    tier: SubscriptionTier;
    onSelect: (tier: SubscriptionTier) => void;
    isSelected?: boolean;
}

export function SubscriptionTierCard({
    tier,
    onSelect,
    isSelected = false,
}: SubscriptionTierCardProps) {
    const getTierColor = () => {
        switch (tier.name) {
            case 'Basic':
                return 'from-gray-500 to-gray-600';
            case 'Plus':
                return 'from-blue-500 to-blue-600';
            case 'Vision':
                return 'from-purple-500 to-purple-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const getTierIcon = () => {
        switch (tier.name) {
            case 'Basic':
                return '💎';
            case 'Plus':
                return '⭐';
            case 'Vision':
                return '🏆';
            default:
                return '💎';
        }
    };

    return (
        <Card
            className={`relative transition-all ${isSelected
                    ? 'border-2 border-[#008B8B] shadow-lg'
                    : 'border hover:shadow-md'
                } ${tier.isPopular ? 'scale-105' : ''}`}
        >
            {tier.isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500">
                    Most Popular
                </Badge>
            )}

            <CardHeader className="text-center">
                <div className="mb-2 text-4xl">{getTierIcon()}</div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="mt-2">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Features List */}
                <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* Select Button */}
                <Button
                    onClick={() => onSelect(tier)}
                    className={`w-full ${isSelected
                            ? 'bg-[#008B8B] hover:bg-[#006B6B]'
                            : `bg-gradient-to-r ${getTierColor()} hover:opacity-90`
                        }`}
                >
                    {isSelected ? 'Selected' : 'Select Plan'}
                </Button>
            </CardContent>
        </Card>
    );
}
