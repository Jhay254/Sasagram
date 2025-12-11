'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Flame, Trophy, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';

export function StreakTracker() {
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isNewDay, setIsNewDay] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        recordDailyOpen();
    }, []);

    const recordDailyOpen = async () => {
        try {
            const res = await api.post('/engagement/streak/record');
            setStreak(res.data.streak);
            setIsNewDay(res.data.isNewDay);
        } catch (error) {
            console.error('Failed to record daily open:', error);
            // Fallback: just fetch streak
            try {
                const res = await api.get('/engagement/streak');
                setStreak(res.data.streak);
            } catch (e) {
                console.error('Failed to fetch streak:', e);
            }
        } finally {
            setLoading(false);
        }
    };

    const getMotivationalMessage = () => {
        if (streak === 0) return "Start your streak today!";
        if (streak === 1) return "Great start! Come back tomorrow!";
        if (streak < 7) return `${7 - streak} days to a week!`;
        if (streak < 30) return `${30 - streak} days to a month!`;
        if (streak === 30) return "🎉 30 day milestone!";
        return "You're on fire!";
    };

    const getStreakColor = () => {
        if (streak === 0) return "text-gray-400";
        if (streak < 7) return "text-orange-500";
        if (streak < 30) return "text-red-500";
        return "text-purple-500";
    };

    if (loading) {
        return (
            <Card className="animate-pulse">
                <CardHeader className="pb-3">
                    <div className="h-5 w-24 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                    <div className="h-12 w-12 bg-muted rounded-full mx-auto" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden">
            {isNewDay && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs text-center py-1 font-medium animate-in slide-in-from-top">
                    🎉 Streak updated!
                </div>
            )}

            <CardHeader className={cn("pb-3", isNewDay && "pt-8")}>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Daily Streak
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-col items-center">
                    <div className={cn("text-5xl font-bold", getStreakColor())}>
                        {streak}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {streak === 1 ? 'day' : 'days'}
                    </p>
                </div>

                <p className="text-center text-sm font-medium text-muted-foreground">
                    {getMotivationalMessage()}
                </p>

                {streak > 0 && (
                    <div className="flex gap-1 justify-center flex-wrap">
                        {Array.from({ length: Math.min(streak, 30) }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-2 w-2 rounded-full",
                                    i < streak ? "bg-orange-500" : "bg-muted"
                                )}
                                title={isMounted ? format(subDays(new Date(), streak - i - 1), 'MMM d') : ''}
                            />
                        ))}
                        {streak > 30 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                +{streak - 30}
                            </Badge>
                        )}
                    </div>
                )}

                {streak >= 7 && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-medium">
                            {streak >= 30 ? "Legendary!" : streak >= 14 ? "On Fire!" : "Week Warrior!"}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
