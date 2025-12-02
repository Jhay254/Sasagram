'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
    userId: string;
    name: string;
    avatar: string | null;
    points: number;
    badgeCount: number;
}

export function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const response = await api.get('/gamification/leaderboard');
            setLeaderboard(response.data);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
        if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
        if (index === 2) return <Award className="h-6 w-6 text-amber-700" />;
        return <span className="text-zinc-500 font-semibold">#{index + 1}</span>;
    };

    if (loading) {
        return (
            <Card className="p-6 bg-zinc-900 border-zinc-800">
                <div className="h-6 bg-zinc-800 rounded w-1/3 mb-6 animate-pulse" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-zinc-900 border-zinc-800">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Contributors
            </h3>

            <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                    <div
                        key={entry.userId}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${index < 3
                                ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700'
                                : 'bg-zinc-950 hover:bg-zinc-900'
                            }`}
                    >
                        <div className="w-8 flex items-center justify-center">
                            {getRankIcon(index)}
                        </div>

                        <Avatar className="h-10 w-10 bg-zinc-700">
                            <div className="flex items-center justify-center h-full w-full text-sm font-semibold">
                                {entry.name.charAt(0).toUpperCase()}
                            </div>
                        </Avatar>

                        <div className="flex-1">
                            <p className="font-semibold text-white">{entry.name}</p>
                            <p className="text-xs text-zinc-500">{entry.badgeCount} badges</p>
                        </div>

                        <div className="text-right">
                            <p className="text-lg font-bold text-yellow-500">{entry.points}</p>
                            <p className="text-xs text-zinc-500">points</p>
                        </div>
                    </div>
                ))}
            </div>

            {leaderboard.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No rankings yet. Be the first!</p>
                </div>
            )}
        </Card>
    );
}
