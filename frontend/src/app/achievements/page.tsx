'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { Leaderboard } from '@/components/gamification/Leaderboard';

export default function AchievementsPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
                        <p className="text-muted-foreground">
                            Unlock badges and earn points as you build your digital legacy.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AchievementsList />
                        </div>
                        <div>
                            <Leaderboard />
                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
