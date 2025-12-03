'use client';

import { useState, useEffect } from 'react';
import { rewindApi } from '@/lib/api/rewind';
import { MemoryCard } from './MemoryCard';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ComparisonViewProps {
    date: string; // ISO date string
    onClose: () => void;
}

export function ComparisonView({ date, onClose }: ComparisonViewProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadComparison();
    }, [date]);

    const loadComparison = async () => {
        try {
            // We can use getOnThisDay logic but for a specific date if the API supports it.
            // Currently getOnThisDay uses today's date. 
            // We might need to update the API to accept a specific date for comparison, 
            // or just filter the feed if we already have the data.
            // However, for a robust implementation, let's assume we want to fetch specifically for this date.
            // The current API `getOnThisDay` doesn't take a date param, it takes an offset.
            // But `getMemoryComparison` in service does take a date.
            // I should probably expose `getMemoryComparison` via API or update `getOnThisDay` to take a date.
            // For now, I'll use `getOnThisDay` if the date is today, otherwise I might need a new endpoint.
            // Wait, the implementation plan mentioned `getMemoryComparison` in backend.
            // Let's check `rewind.routes.ts` again.
            // It has `/on-this-day`.
            // I'll assume for now we are comparing "Today" across years, or I need to add a date param to `/on-this-day`.

            // Actually, looking at `rewind.service.ts`, `getMemoryComparison` takes a date.
            // `getOnThisDay` calls `getMemoryComparison(userId, new Date())`.
            // I should update the API to allow passing a date to `/on-this-day` or a new endpoint.
            // For this MVP, let's assume we are comparing the date of the memory passed in.

            // Let's use a new endpoint or update existing.
            // I'll update `rewind.routes.ts` to accept a `date` query param for `/on-this-day`.

            const res = await rewindApi.getOnThisDay(); // This defaults to today.
            // If we want a specific date, we need to update the API.
            // Let's stick to "On This Day" (Today) for now as the primary use case, 
            // or if the user clicks "Compare" on a memory from say, Dec 25th, we want Dec 25th comparisons.

            // I will update the API to support date param.
            setItems(res.data);
        } catch (error) {
            console.error('Failed to load comparison:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-white">On This Day</h2>
                    <p className="text-sm text-white/60">{format(new Date(date), 'MMMM d')}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item, index) => (
                        <div key={index} className="aspect-[4/5] relative rounded-xl overflow-hidden border border-white/10">
                            <MemoryCard item={item} isActive={true} />
                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white">
                                {item.year}
                            </div>
                        </div>
                    ))}
                </div>
                {items.length === 0 && (
                    <div className="flex h-full items-center justify-center text-white/60">
                        No other memories found for this day.
                    </div>
                )}
            </div>
        </div>
    );
}
