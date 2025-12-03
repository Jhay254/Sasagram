'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MapPin, Calendar, Navigation } from 'lucide-react';
import { api } from '@/lib/api';

interface LocationPoint {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    placeName?: string;
    isSignificant: boolean;
}

export function MapTimeline() {
    const [locations, setLocations] = useState<LocationPoint[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLocations();
    }, [selectedDate]);

    const loadLocations = async () => {
        setLoading(true);
        try {
            // In a real app, we'd fetch based on date range
            const res = await api.get('/location/history', {
                params: {
                    startDate: new Date(selectedDate.setHours(0, 0, 0, 0)).toISOString(),
                    endDate: new Date(selectedDate.setHours(23, 59, 59, 999)).toISOString(),
                }
            });
            setLocations(res.data);
        } catch (error) {
            console.error('Failed to load locations:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Location Timeline
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {selectedDate.toLocaleDateString()}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 relative p-0 overflow-hidden">
                {/* Placeholder for Google Maps */}
                <div className="w-full h-full bg-slate-100 flex items-center justify-center relative">
                    <div className="text-center p-4">
                        <Navigation className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-medium">Interactive Map View</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                            Google Maps integration requires an API key.
                            Locations are plotted on this timeline.
                        </p>
                    </div>

                    {/* Mock Location Points */}
                    {locations.map((loc, i) => (
                        <div
                            key={loc.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                            style={{
                                left: `${50 + (Math.random() * 40 - 20)}%`, // Mock positioning
                                top: `${50 + (Math.random() * 40 - 20)}%`
                            }}
                        >
                            <MapPin className={`h-6 w-6 ${loc.isSignificant ? 'text-primary' : 'text-slate-400'} drop-shadow-md`} />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs p-1 rounded whitespace-nowrap z-10">
                                {loc.placeName || 'Unknown Location'}
                                <br />
                                <span className="text-[10px] opacity-75">
                                    {new Date(loc.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Timeline Scrubber Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 border-t">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium w-12">00:00</span>
                        <Slider
                            defaultValue={[12]}
                            max={24}
                            step={1}
                            className="flex-1"
                        />
                        <span className="text-xs font-medium w-12">23:59</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
