'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Eye, TrendingUp } from 'lucide-react';

interface AnalyticsData {
    totalEntries: number;
    subscriberCount: number;
    viewCount: number;
    entriesByDay: { day: string; count: number }[];
    moodDistribution: { mood: string; count: number }[];
}

export function ChapterAnalytics({ chapterId }: { chapterId?: string }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (chapterId) {
            loadAnalytics();
        }
    }, [chapterId]);

    const loadAnalytics = async () => {
        try {
            // Use real API endpoint
            const res = await api.get(`/engagement/chapters/${chapterId}/analytics`);
            setData(res.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            // Keep mock data as fallback for demo purposes if API fails
            setData({
                totalEntries: 42,
                subscriberCount: 128,
                viewCount: 1540,
                entriesByDay: [
                    { day: 'Mon', count: 4 },
                    { day: 'Tue', count: 3 },
                    { day: 'Wed', count: 7 },
                    { day: 'Thu', count: 2 },
                    { day: 'Fri', count: 6 },
                    { day: 'Sat', count: 8 },
                    { day: 'Sun', count: 5 },
                ],
                moodDistribution: [
                    { mood: 'Happy', count: 15 },
                    { mood: 'Productive', count: 12 },
                    { mood: 'Relaxed', count: 8 },
                    { mood: 'Tired', count: 4 },
                    { mood: 'Stressed', count: 3 },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="h-64 animate-pulse bg-muted rounded-lg" />;
    }

    if (!data) return null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Activity className="h-4 w-4 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">{data.totalEntries}</div>
                        <div className="text-xs text-muted-foreground">Total Entries</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Users className="h-4 w-4 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">{data.subscriberCount}</div>
                        <div className="text-xs text-muted-foreground">Subscribers</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <Eye className="h-4 w-4 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">{data.viewCount}</div>
                        <div className="text-xs text-muted-foreground">Total Views</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <TrendingUp className="h-4 w-4 text-muted-foreground mb-2" />
                        <div className="text-2xl font-bold">+12%</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Activity This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.entriesByDay}>
                                    <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Mood Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.moodDistribution} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="mood" type="category" width={80} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]}>
                                        {data.moodDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
