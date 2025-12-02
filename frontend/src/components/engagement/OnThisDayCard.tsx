'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { History, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export function OnThisDayCard() {
    const [memoryCount, setMemoryCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkMemories();
    }, []);

    const checkMemories = async () => {
        try {
            const res = await api.get('/rewind/on-this-day');
            setMemoryCount(res.data.length);
        } catch (error) {
            console.error('Failed to check memories:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || memoryCount === 0) return null;

    return (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl" />

            <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <History className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wider text-white/80">On This Day</span>
                </div>

                <h3 className="text-2xl font-bold mb-1">
                    {memoryCount} {memoryCount === 1 ? 'Memory' : 'Memories'} Found
                </h3>
                <p className="text-white/80 text-sm mb-4">
                    See what you were doing on {format(new Date(), 'MMMM do')} in previous years.
                </p>

                <Link href="/rewind">
                    <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-white/90 font-medium border-none">
                        View Memories <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
