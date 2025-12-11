'use client';

import { Chapter } from '@/lib/types/discovery.types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import Image from 'next/image';

interface ChapterPreviewCarouselProps {
    chapters: Chapter[];
    maxVisible?: number;
    onChapterClick?: (chapter: Chapter) => void;
}

export function ChapterPreviewCarousel({
    chapters,
    maxVisible = 3,
    onChapterClick,
}: ChapterPreviewCarouselProps) {
    const visibleChapters = chapters.slice(0, maxVisible);
    const remainingCount = Math.max(0, chapters.length - maxVisible);

    return (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {visibleChapters.map((chapter) => (
                <Card
                    key={chapter.id}
                    className="group relative min-w-[120px] flex-shrink-0 cursor-pointer overflow-hidden transition-transform hover:scale-105"
                    onClick={() => onChapterClick?.(chapter)}
                >
                    <div className="relative aspect-[3/4] w-full">
                        <Image
                            src={chapter.thumbnail}
                            alt={chapter.title}
                            fill
                            sizes="150px"
                            className="object-cover"
                        />
                        {!chapter.isFree && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm">
                                <div className="flex h-full items-center justify-center">
                                    <Lock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="mb-1 text-xs font-medium text-white line-clamp-2">
                            {chapter.title}
                        </p>
                        <Badge
                            variant={chapter.isFree ? 'secondary' : 'default'}
                            className={`text-xs ${chapter.isFree
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-amber-500 hover:bg-amber-600'
                                }`}
                        >
                            {chapter.isFree ? 'FREE' : `$${chapter.price}`}
                        </Badge>
                        {chapter.duration && (
                            <p className="mt-1 text-xs text-gray-300">{chapter.duration}</p>
                        )}
                    </div>
                </Card>
            ))}

            {remainingCount > 0 && (
                <Card className="flex min-w-[120px] flex-shrink-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="text-center">
                        <Lock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-2xl font-bold text-gray-600">🔒</p>
                        <p className="mt-1 text-xs font-medium text-gray-600">
                            +{remainingCount} More
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
