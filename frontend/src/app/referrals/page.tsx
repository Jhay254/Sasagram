'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReferralDashboard } from '@/components/growth/ReferralDashboard';

export default function ReferralPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
                        <p className="text-muted-foreground">
                            Invite friends and earn rewards together.
                        </p>
                    </div>

                    <ReferralDashboard />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
