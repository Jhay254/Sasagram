'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { MemoryMap } from '@/components/engagement/MemoryMap';

export default function MapPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6 h-[calc(100vh-100px)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Memory Map</h1>
                            <p className="text-muted-foreground">Explore your journey across the globe.</p>
                        </div>
                    </div>

                    <MemoryMap />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
