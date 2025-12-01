'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { TagVerificationDialog } from '@/components/network/TagVerificationDialog';

interface Tag {
    id: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    status: string;
    message?: string;
    tagger: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: string;
}

export default function TagsPage() {
    const [pendingTags, setPendingTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);

    useEffect(() => {
        loadPendingTags();
    }, []);

    const loadPendingTags = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tags/pending');
            setPendingTags(response.data);
        } catch (error) {
            console.error('Failed to load pending tags:', error);
            toast.error('Failed to load pending tags');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = (tag: Tag) => {
        setSelectedTag(tag);
        setVerifyDialogOpen(true);
    };

    const handleDecline = async (tagId: string) => {
        try {
            await api.post(`/tags/${tagId}/decline`);
            toast.success('Tag declined');
            loadPendingTags();
        } catch (error) {
            console.error('Failed to decline tag:', error);
            toast.error('Failed to decline tag');
        }
    };

    const handleVerificationComplete = () => {
        setVerifyDialogOpen(false);
        setSelectedTag(null);
        loadPendingTags();
        toast.success('Tag verified! Your memory completeness score has been updated.');
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tagged Memories</h1>
                        <p className="text-muted-foreground">
                            Friends have tagged you in their memories. Verify to add your perspective!
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Tags</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pendingTags.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Awaiting your verification
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">People Tagging You</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {new Set(pendingTags.map(t => t.tagger.id)).size}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Unique taggers
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Memory Completeness</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">--</div>
                                <p className="text-xs text-muted-foreground">
                                    Verify tags to increase
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Tags List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Verifications</CardTitle>
                            <CardDescription>
                                Review and verify memories you were part of
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Loading tags...
                                </div>
                            ) : pendingTags.length === 0 ? (
                                <div className="text-center py-8">
                                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        No pending tags. When friends tag you in their memories, they'll appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingTags.map((tag) => (
                                        <div key={tag.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold">{tag.eventTitle}</h3>
                                                        <Badge variant="outline">
                                                            {new Date(tag.eventDate).toLocaleDateString()}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        Tagged by <span className="font-medium">{tag.tagger.name || tag.tagger.email}</span>
                                                    </p>
                                                    {tag.message && (
                                                        <p className="text-sm italic mb-3">"{tag.message}"</p>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleVerify(tag)}
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Verify & Add Perspective
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDecline(tag.id)}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Decline
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Verification Dialog */}
                {selectedTag && (
                    <TagVerificationDialog
                        tag={selectedTag}
                        open={verifyDialogOpen}
                        onOpenChange={setVerifyDialogOpen}
                        onComplete={handleVerificationComplete}
                    />
                )}
            </AppLayout>
        </ProtectedRoute>
    );
}
