import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CreatorCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Hero Image/Video Skeleton */}
                <Skeleton className="aspect-video w-full" />

                {/* Creator Info Section */}
                <div className="p-4 sm:p-6 space-y-4">
                    {/* Header: Avatar + Name */}
                    <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Life Metrics */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </div>

                    {/* Social Proof Badges */}
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    {/* Preview Chapters */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2 overflow-hidden">
                            <Skeleton className="h-24 w-32 rounded-lg flex-shrink-0" />
                            <Skeleton className="h-24 w-32 rounded-lg flex-shrink-0" />
                            <Skeleton className="h-24 w-32 rounded-lg flex-shrink-0" />
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Skeleton className="h-10 flex-1" />
                        <Skeleton className="h-10 flex-1" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
