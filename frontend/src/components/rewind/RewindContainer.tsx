'use client';

import { useState, useEffect, useRef } from 'react';
import { rewindApi } from '@/lib/api/rewind';
import { api } from '@/lib/api';
import { MemoryCard } from './MemoryCard';
import { TimelineScrubber } from './TimelineScrubber';
import { ComparisonView } from './ComparisonView';
import { MemoryMap } from '../engagement/MemoryMap';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Shuffle, Map as MapIcon, SplitSquareHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RewindContainer() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showMap, setShowMap] = useState(false);
    const [comparisonDate, setComparisonDate] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Generate years for scrubber (e.g., last 10 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    useEffect(() => {
        loadFeed();
    }, []);

    const loadFeed = async () => {
        try {
            const res = await rewindApi.getFeed();
            setItems(res.data.items);
        } catch (error) {
            console.error('Failed to load rewind feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const trackAction = async (action: string, metadata?: any) => {
        try {
            await api.post('/engagement/analytics/track', { action, metadata });
        } catch (error) {
            // Silent fail - analytics shouldn't break UX
        }
    };

    const handleRandom = async () => {
        setLoading(true);
        trackAction('random_memory_click');
        try {
            const res = await rewindApi.getRandomMemory();
            if (res.data) {
                const newItem = {
                    type: 'memory',
                    data: res.data,
                    date: res.data.timestamp,
                    year: new Date(res.data.timestamp).getFullYear(),
                };
                setItems([newItem, ...items]);
                setActiveIndex(0);
                if (containerRef.current) {
                    containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } catch (error) {
            console.error('Failed to fetch random memory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = () => {
        if (!containerRef.current) return;
        
        const { scrollTop, clientHeight } = containerRef.current;
        const index = Math.round(scrollTop / clientHeight);
        
        if (index !== activeIndex) {
            setActiveIndex(index);
            // Track scroll to new memory
            if (items[index]) {
                trackAction('scroll', { year: items[index].year, index });
            }
        }
    };

    const handleYearSelect = (year: number) => {
        trackAction('year_jump', { year });
        // Find first item from that year
        const index = items.findIndex(item => item.year === year);
        if (index !== -1 && containerRef.current) {
            containerRef.current.scrollTo({
                top: index * containerRef.current.clientHeight,
                behavior: 'smooth'
            });
        }
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full bg-black">
            {/* Header Controls */}
            <div className="absolute left-4 top-4 z-50">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </div>

            {/* Engagement Controls */}
            <div className="absolute right-4 top-4 z-50 flex flex-col gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                    onClick={handleRandom}
                    title="Random Memory"
                >
                    <Shuffle className="h-6 w-6" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                    onClick={() => {
                        trackAction('map_view_open');
                        setShowMap(true);
                    }}
                    title="View Map"
                >
                    <MapIcon className="h-6 w-6" />
                </Button>
                {items[activeIndex] && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                        onClick={() => {
                            trackAction('comparison_view_open', { date: items[activeIndex].date });
                            setComparisonDate(items[activeIndex].date);
                        }}
                        title="Compare Years"
                    >
                        <SplitSquareHorizontal className="h-6 w-6" />
                    </Button>
                )}
            </div>

            {/* Timeline Scrubber */}
            <TimelineScrubber 
                years={years} 
                activeYear={items[activeIndex]?.year || currentYear} 
                onYearSelect={handleYearSelect} 
            />

            {/* Main Feed */}
            <div 
                ref={containerRef}
                className="h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth"
                onScroll={handleScroll}
            >
                {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="h-full w-full snap-start">
                        <MemoryCard 
                            item={item} 
                            isActive={index === activeIndex} 
                        />
                    </div>
                ))}
                
                {items.length === 0 && !loading && (
                    <div className="flex h-full w-full items-center justify-center text-white">
                        <p>No memories found. Start creating some!</p>
                    </div>
                )}
            </div>

            {/* Overlays */}
            {showMap && (
                <div className="absolute inset-0 z-50 bg-black animate-in fade-in duration-300">
                    <MemoryMap />
                    <Button 
                        className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border border-white/20" 
                        onClick={() => setShowMap(false)}
                    >
                        Close Map
                    </Button>
                </div>
            )}

            {comparisonDate && (
                <ComparisonView date={comparisonDate} onClose={() => setComparisonDate(null)} />
            )}
        </div>
    );
}
