'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Smile } from 'lucide-react';

interface FeedEntry {
    id: string;
    content: string;
    mood?: string;
    location?: string;
    mediaUrls: string[];
    timestamp: string;
    user: {
        id: string;
        name: string | null;
    };
    chapter?: {
        id: string;
        title: string;
    };
}

export function LivingFeed() {
    const [entries, setEntries] = useState<FeedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        loadFeed();
    }, []);

    const loadFeed = async () => {
        try {
            const res = await api.get('/living/feed');
            setEntries(res.data.entries || res.data);
        } catch (error) {
            console.error('Failed to load feed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="h-48 animate-pulse bg-muted rounded-lg" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Living Feed</h2>
            </div>

            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                    {entries.map((entry) => (
                        <Card key={entry.id} className="w-[300px] shrink-0">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{entry.user.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{entry.user.name || 'User'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {isMounted ? formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true }) : '...'}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                {entry.mediaUrls.length > 0 && (
                                    <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                                        {/* Placeholder for image */}
                                        <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground">
                                            Image
                                        </div>
                                    </div>
                                )}

                                <p className="text-sm whitespace-normal line-clamp-3">
                                    {entry.content}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {entry.mood && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Smile className="mr-1 h-3 w-3" />
                                            {entry.mood}
                                        </Badge>
                                    )}
                                    {entry.location && (
                                        <span className="flex items-center">
                                            <MapPin className="mr-1 h-3 w-3" />
                                            {entry.location}
                                        </span>
                                    )}
                                </div>

                                {entry.chapter && (
                                    <div className="pt-2 border-t">
                                        <span className="text-xs font-medium text-primary">
                                            Chapter: {entry.chapter.title}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {entries.length === 0 && (
                        <div className="w-full py-8 text-center text-muted-foreground">
                            No updates yet. Start sharing your journey!
                        </div>
                    )}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
