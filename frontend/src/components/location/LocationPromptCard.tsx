'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Camera, Mic, Send, X } from 'lucide-react';

interface LocationPrompt {
    id: string;
    question: string;
    location: {
        placeName?: string;
        timestamp: string;
    };
}

interface LocationPromptCardProps {
    prompt: LocationPrompt;
    onAnswered: () => void;
}

export function LocationPromptCard({ prompt, onAnswered }: LocationPromptCardProps) {
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!response.trim()) return;

        setSubmitting(true);
        try {
            await api.post(`/location/prompts/${prompt.id}/answer`, {
                response,
                // Photos/Audio would be uploaded first and URLs passed here
                photos: [],
                audioUrl: null
            });
            toast.success('Response saved');
            onAnswered();
        } catch (error) {
            toast.error('Failed to save response');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Location Prompt</span>
                </div>
                <CardTitle className="text-lg leading-tight">
                    {prompt.question}
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    at {prompt.location.placeName || 'Unknown Location'} • {new Date(prompt.location.timestamp).toLocaleTimeString()}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="Type your answer..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="min-h-[100px] resize-none"
                />

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Camera className="h-4 w-4" />
                        Add Photo
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Mic className="h-4 w-4" />
                        Record
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="ghost" size="sm" onClick={onAnswered}>
                    Skip
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!response.trim() || submitting}
                    className="gap-2"
                >
                    <Send className="h-4 w-4" />
                    Save Memory
                </Button>
            </CardFooter>
        </Card>
    );
}
