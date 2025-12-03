'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Briefcase, MapPin, Heart, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface MilestoneSignal {
    type: 'job_change' | 'location_change' | 'relationship_milestone';
    confidence: number;
    details: string;
    detectedAt: string;
}

const milestoneIcons = {
    job_change: Briefcase,
    location_change: MapPin,
    relationship_milestone: Heart,
};

const milestoneLabels = {
    job_change: 'Career Update',
    location_change: 'Location Change',
    relationship_milestone: 'Relationship Milestone',
};

const milestoneColors = {
    job_change: 'bg-blue-100 text-blue-800 border-blue-200',
    location_change: 'bg-green-100 text-green-800 border-green-200',
    relationship_milestone: 'bg-pink-100 text-pink-800 border-pink-200',
};

export function MilestoneDetection({ onChapterComplete }: { onChapterComplete?: () => void }) {
    const [detecting, setDetecting] = useState(false);
    const [signal, setSignal] = useState<MilestoneSignal | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleDetect = async () => {
        setDetecting(true);
        try {
            const res = await api.post('/living/ai/detect-completion');
            const detectedSignal = res.data.signal;

            if (detectedSignal) {
                setSignal(detectedSignal);
                setConfirmOpen(true);
            } else {
                toast.info('No major life changes detected yet. Keep sharing your journey!');
            }
        } catch (error) {
            console.error('Failed to detect milestones:', error);
            toast.error('Failed to detect milestones');
        } finally {
            setDetecting(false);
        }
    };

    const handleConfirmComplete = async () => {
        if (!signal) return;

        try {
            // Complete the current chapter
            const activeChapterRes = await api.get('/engagement/chapters/active');
            const activeChapter = activeChapterRes.data;

            if (activeChapter) {
                await api.post(`/engagement/chapters/${activeChapter.id}/complete`, {
                    trigger: signal.type,
                });
                toast.success('Chapter completed! Ready to start a new one.');
                setConfirmOpen(false);
                setSignal(null);
                onChapterComplete?.();
            }
        } catch (error) {
            console.error('Failed to complete chapter:', error);
            toast.error('Failed to complete chapter');
        }
    };

    const Icon = signal ? milestoneIcons[signal.type] : Sparkles;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <CardTitle className="text-lg">AI Chapter Detection</CardTitle>
                        </div>
                    </div>
                    <CardDescription>
                        Let AI analyze your recent activity to detect major life changes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleDetect}
                        disabled={detecting}
                        className="w-full"
                        variant="outline"
                    >
                        {detecting ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Detect Life Milestones
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            Milestone Detected!
                        </DialogTitle>
                        <DialogDescription>
                            AI has detected a significant life change in your recent activity.
                        </DialogDescription>
                    </DialogHeader>

                    {signal && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={milestoneColors[signal.type]}
                                >
                                    {milestoneLabels[signal.type]}
                                </Badge>
                                <Badge variant="secondary">
                                    {signal.confidence}% confidence
                                </Badge>
                            </div>

                            <div className="rounded-lg border bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">
                                    {signal.details}
                                </p>
                            </div>

                            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                                <div className="text-sm text-amber-800">
                                    <p className="font-medium">Complete current chapter?</p>
                                    <p className="text-xs mt-1">
                                        This will mark your current chapter as complete and allow you to start a new one.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Not Yet
                        </Button>
                        <Button onClick={handleConfirmComplete}>
                            Complete Chapter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
