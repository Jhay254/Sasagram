'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Lock, Star } from 'lucide-react';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
    category: string;
    unlocked: boolean;
    unlockedAt: string | null;
}

export function AchievementsList() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        try {
            const response = await api.get('/gamification/achievements');
            setAchievements(response.data);
        } catch (error) {
            console.error('Failed to load achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            social: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            content: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            streak: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            legacy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        };
        return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6 animate-pulse bg-zinc-900 border-zinc-800">
                        <div className="h-16 w-16 bg-zinc-800 rounded-full mb-4" />
                        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-zinc-800 rounded w-full" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Achievements</h2>
                    <p className="text-muted-foreground">
                        {achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked
                    </p>
                </div>
                <div className="flex items-center gap-2 text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-lg font-semibold">
                        {achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)} pts
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                    <Card
                        key={achievement.id}
                        className={`p-6 border transition-all ${achievement.unlocked
                                ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700 shadow-lg'
                                : 'bg-zinc-950 border-zinc-800 opacity-60'
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`p-3 rounded-full ${achievement.unlocked ? 'bg-yellow-500/20' : 'bg-zinc-800'
                                    }`}
                            >
                                {achievement.unlocked ? (
                                    <Trophy className="h-8 w-8 text-yellow-500" />
                                ) : (
                                    <Lock className="h-8 w-8 text-zinc-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-white">{achievement.title}</h3>
                                    <Badge variant="outline" className={getCategoryColor(achievement.category)}>
                                        {achievement.category}
                                    </Badge>
                                </div>
                                <p className="text-sm text-zinc-400 mb-3">{achievement.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-yellow-500 font-medium">
                                        +{achievement.points} pts
                                    </span>
                                    {achievement.unlocked && achievement.unlockedAt && (
                                        <span className="text-xs text-zinc-500">
                                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
