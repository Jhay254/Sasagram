'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Tag {
    id: string;
    eventTitle: string;
    eventDate: string;
    tagger: {
        name: string;
        email: string;
    };
}

interface Props {
    tag: Tag;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function TagVerificationDialog({ tag, open, onOpenChange, onComplete }: Props) {
    const [perspective, setPerspective] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!perspective.trim()) {
            toast.error('Please add your perspective');
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/tags/${tag.id}/verify`, {
                perspective: perspective.trim(),
                details: details.trim() || undefined,
            });

            onComplete();
        } catch (error) {
            console.error('Failed to verify tag:', error);
            toast.error('Failed to verify tag');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Verify Tag: {tag.eventTitle}</DialogTitle>
                    <DialogDescription>
                        {tag.tagger.name || tag.tagger.email} tagged you in this memory from{' '}
                        {new Date(tag.eventDate).toLocaleDateString()}. Add your perspective to verify.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="perspective">Your Perspective *</Label>
                        <Textarea
                            id="perspective"
                            placeholder="Share your memory of this event..."
                            value={perspective}
                            onChange={(e) => setPerspective(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be added to your biography and visible to your subscribers.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="details">Additional Details (Optional)</Label>
                        <Textarea
                            id="details"
                            placeholder="Any additional context, people present, or memorable moments..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Verifying...' : 'Verify Tag'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
