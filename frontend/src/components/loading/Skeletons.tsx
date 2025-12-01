'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export function EditorSkeleton() {
    return (
        <div className="flex h-screen">
            {/* Sidebar Skeleton */}
            <div className="w-64 border-r p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>

            {/* Editor Skeleton */}
            <div className="flex-1 p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <Skeleton className="h-64 w-full" />
            <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10">
                <Card className="p-6 mb-6">
                    <div className="flex gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
