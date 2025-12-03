'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Share2, MapPin, Calendar, MoreHorizontal, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
    item: {
        type: 'content' | 'media' | 'feed' | 'memory';
        data: any;
        date: string;
        year: number;
    };
    isActive: boolean;
}

export function MemoryCard({ item, isActive }: MemoryCardProps) {
    const [liked, setLiked] = useState(false);

    const { data, type, date } = item;
    const dateObj = new Date(date);

    // Helper to render content based on type
    const renderContent = () => {
        if (type === 'media' || (type === 'feed' && data.mediaUrls?.length > 0)) {
            const imageUrl = type === 'media' ? data.url : data.mediaUrls[0];
            return (
                <div className="relative h-full w-full">
                    <img
                        src={imageUrl || '/placeholder-image.jpg'}
                        alt="Memory"
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                </div>
            );
        }

        // Text content
        const text = data.text || data.content || '';
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-center text-white">
                <Quote className="mb-6 h-12 w-12 opacity-50" />
                <p className="text-2xl font-medium leading-relaxed md:text-3xl">
                    "{text}"
                </p>
            </div>
        );
    };

    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden bg-black transition-opacity duration-500",
            isActive ? "opacity-100" : "opacity-40"
        )}>
            {/* Main Content */}
            {renderContent()}

            {/* Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="mb-4 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(dateObj, 'MMMM d, yyyy')}
                    </Badge>
                    {data.location && (
                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                            <MapPin className="mr-1 h-3 w-3" />
                            {data.location}
                        </Badge>
                    )}
                    <Badge className="bg-primary/80 hover:bg-primary">
                        {new Date().getFullYear() - dateObj.getFullYear()} years ago
                    </Badge>
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-white text-shadow-sm">You</p>
                            <p className="text-xs text-white/80">
                                {type === 'feed' ? 'Living Feed' : type === 'media' ? 'Photo Gallery' : 'Journal Entry'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn("h-12 w-12 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40", liked && "text-red-500")}
                            onClick={() => setLiked(!liked)}
                        >
                            <Heart className={cn("h-6 w-6", liked && "fill-current")} />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-12 w-12 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                        >
                            <Share2 className="h-6 w-6" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-12 w-12 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                        >
                            <MoreHorizontal className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                {/* Caption if media */}
                {(type === 'media' || (type === 'feed' && data.mediaUrls?.length > 0)) && (data.text || data.content) && (
                    <p className="mt-4 line-clamp-2 text-sm text-white/90">
                        {data.text || data.content}
                    </p>
                )}
            </div>
        </div>
    );
}
