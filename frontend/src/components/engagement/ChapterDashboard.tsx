'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MilestoneDetection } from './MilestoneDetection';

interface Chapter {
    id: string;
    title: string;
    startDate: string;
    status: string;
    _count?: {
        entries: number;
    };
}

export function ChapterDashboard() {
    const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        loadActiveChapter();
    }, []);

    const loadActiveChapter = async () => {
        try {
            const res = await api.get('/engagement/chapters/active');
            setActiveChapter(res.data);
        } catch (error) {
            console.error('Failed to load active chapter:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateChapter = async () => {
        if (!newTitle.trim()) return;

        try {
            await api.post('/engagement/chapters', {
                title: newTitle,
                content: newContent,
                startDate: new Date().toISOString(),
            });

            setCreateOpen(false);
            setNewTitle('');
            setNewContent('');
            loadActiveChapter();
            toast.success('New chapter started!');
        } catch (error) {
            console.error('Failed to create chapter:', error);
            toast.error('Failed to create chapter');
        }
    };

    const handleCompleteChapter = async () => {
        if (!activeChapter) return;

        try {
            await api.post(`/engagement/chapters/${activeChapter.id}/complete`, {
                trigger: 'user_manual',
            });
            loadActiveChapter();
            toast.success('Chapter completed!');
        } catch (error) {
            console.error('Failed to complete chapter:', error);
            toast.error('Failed to complete chapter');
        }
    };

    if (loading) {
        return <div className="h-32 animate-pulse bg-muted rounded-lg" />;
    }

    return (
        <>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Current Chapter</CardTitle>
                        </div>
                        {activeChapter && (
                            <Button variant="ghost" size="sm" onClick={handleCompleteChapter}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Complete
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {activeChapter ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold">{activeChapter.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Started {isMounted ? formatDistanceToNow(new Date(activeChapter.startDate), { addSuffix: true }) : '...'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Chapter Progress</span>
                                    <span>Ongoing</span>
                                </div>
                                <Progress value={65} className="h-2" />
                            </div>

                            <div className="pt-4 border-t">
                                <MilestoneDetection onChapterComplete={loadActiveChapter} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-muted-foreground mb-4">No active chapter. Start a new one to track your journey.</p>
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Start New Chapter
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Start New Chapter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Chapter Title</Label>
                            <Input
                                placeholder="e.g., The Startup Journey, Moving to New York"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Textarea
                                placeholder="What is this chapter about?"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateChapter}>Start Chapter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
