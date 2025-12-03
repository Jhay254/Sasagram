'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { SnippetEditor } from '@/components/viral/SnippetEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SnippetPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Create Story Snippet</h1>
                            <p className="text-muted-foreground">
                                Turn your chapter into a viral video.
                            </p>
                        </div>
                    </div>

                    <SnippetEditor chapterId={params.id} />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
