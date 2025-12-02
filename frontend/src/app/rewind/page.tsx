'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { MapPin, Calendar, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Memory {
    type: 'content' | 'media' | 'feed';
    date: string;
    year: number;
    data: any;
}

export default function RewindPage() {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            const res = await api.get('/rewind/on-this-day');
            setMemories(res.data);
        } catch (error) {
            console.error('Failed to load memories:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextMemory = () => {
        if (currentIndex < memories.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const prevMemory = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-white">
                <div className="animate-pulse text-xl font-medium">Loading your memories...</div>
            </div>
        );
    }

    if (memories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 text-center">
                <Calendar className="h-16 w-16 mb-4 text-primary" />
                <h1 className="text-2xl font-bold mb-2">No memories found for today</h1>
                <p className="text-gray-400 max-w-md">
                    We couldn't find any content from this day in previous years.
                    Start creating memories today to see them here next year!
                </p>
                <Button className="mt-6" onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    const currentMemory = memories[currentIndex];

    return (
        <div className="h-screen w-full bg-black text-white overflow-hidden relative">
            {/* Navigation Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={prevMemory}
                    disabled={currentIndex === 0}
                >
                    <ChevronUp className="h-6 w-6" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={nextMemory}
                    disabled={currentIndex === memories.length - 1}
                >
                    <ChevronDown className="h-6 w-6" />
                </Button>
            </div>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-20">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / memories.length) * 100}%` }}
                />
            </div>

            {/* Memory Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full flex flex-col items-center justify-center p-6"
                >
                    {/* Date Header */}
                    <div className="absolute top-8 left-0 w-full text-center z-10">
                        <h2 className="text-4xl font-bold tracking-tight">{currentMemory.year}</h2>
                        <p className="text-sm font-medium uppercase tracking-widest text-white/70">
                            {format(new Date(currentMemory.date), 'MMMM d')}
                        </p>
                    </div>

                    {/* Content Card */}
                    <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        {/* Image/Media Area */}
                        <div className="aspect-[4/5] bg-zinc-800 relative">
                            {currentMemory.data.mediaUrls?.[0] || currentMemory.data.media?.[0]?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={currentMemory.data.mediaUrls?.[0] || currentMemory.data.media?.[0]?.url}
                                    alt="Memory"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                    <span className="text-lg">No Image</span>
                                </div>
                            )}

                            {/* Location Badge */}
                            {currentMemory.data.location && (
                                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                                    <MapPin className="h-3 w-3" />
                                    {currentMemory.data.location}
                                </div>
                            )}
                        </div>

                        {/* Text Content */}
                        <div className="p-6">
                            <p className="text-lg font-medium leading-relaxed">
                                {currentMemory.data.content || currentMemory.data.text || currentMemory.data.description}
                            </p>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(currentMemory.date), 'h:mm a')}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
