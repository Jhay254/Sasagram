'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChapterDashboard } from '@/components/engagement/ChapterDashboard';
import { LivingFeed } from '@/components/engagement/LivingFeed';
import { ChapterAnalytics } from '@/components/engagement/ChapterAnalytics';
import { StreakTracker } from '@/components/engagement/StreakTracker';

// Mock data for charts
const revenueData = [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
];

const subscriberData = [
    { month: 'Jan', count: 0 },
    { month: 'Feb', count: 0 },
    { month: 'Mar', count: 0 },
    { month: 'Apr', count: 0 },
    { month: 'May', count: 0 },
    { month: 'Jun', count: 0 },
];

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                            <p className="text-muted-foreground">
                                Track your life's journey, chapter by chapter.
                            </p>
                        </div>
                    </div>

                    {/* Active Chapter & AI Detection */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <ChapterDashboard />
                        </div>
                        <div>
                            <StreakTracker />
                        </div>
                    </div>

                    {/* Analytics */}
                    <ChapterAnalytics />

                    {/* Living Feed */}
                    <LivingFeed />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
