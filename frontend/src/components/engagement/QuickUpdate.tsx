'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Image as ImageIcon, Smile, Send } from 'lucide-react';

interface Props {
    onUpdate?: () => void;
}

export function QuickUpdate({ onUpdate }: Props) {
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('');
    const [location, setLocation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;

        try {
            setSubmitting(true);
            await api.post('/engagement/feed', {
                content,
                mood: mood || undefined,
                location: location || undefined,
                isPublic: true,
            });

            setContent('');
            setMood('');
            setLocation('');
            setExpanded(false);
            toast.success('Update posted!');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to post update:', error);
            toast.error('Failed to post update');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div
                        className="relative"
                        onClick={() => setExpanded(true)}
                    >
                        <Textarea
                            placeholder="What's happening in your life right now?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={`resize-none transition-all duration-200 ${expanded ? 'h-32' : 'h-12'}`}
                        />
                    </div>

                    {expanded && (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select value={mood} onValueChange={setMood}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <Smile className="mr-2 h-3 w-3" />
                                            <SelectValue placeholder="Mood" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="happy">Happy</SelectItem>
                                            <SelectItem value="excited">Excited</SelectItem>
                                            <SelectItem value="focused">Focused</SelectItem>
                                            <SelectItem value="tired">Tired</SelectItem>
                                            <SelectItem value="grateful">Grateful</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <div className="relative">
                                        <MapPin className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                        <Input
                                            placeholder="Location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="h-8 text-xs pl-7"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t">
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Add Photo
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpanded(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={submitting || !content.trim()}
                                    >
                                        <Send className="mr-2 h-3 w-3" />
                                        Post Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
