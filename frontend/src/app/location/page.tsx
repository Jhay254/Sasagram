'use client';

import { useState, useEffect } from 'react';
import { MapTimeline } from '@/components/location/MapTimeline';
import { PrivacyZoneManager } from '@/components/location/PrivacyZoneManager';
import { LocationPromptCard } from '@/components/location/LocationPromptCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { MapPin, Shield, MessageSquare } from 'lucide-react';

export default function LocationPage() {
    const [prompts, setPrompts] = useState<any[]>([]);

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            const res = await api.get('/location/prompts');
            setPrompts(res.data);
        } catch (error) {
            console.error('Failed to load prompts:', error);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Location & Context</h1>
                <p className="text-muted-foreground">
                    Manage your location history, privacy zones, and context-aware memories.
                </p>
            </div>

            <Tabs defaultValue="timeline" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="timeline" className="gap-2">
                        <MapPin className="h-4 w-4" /> Timeline
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="gap-2">
                        <Shield className="h-4 w-4" /> Privacy
                    </TabsTrigger>
                    <TabsTrigger value="prompts" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Prompts
                        {prompts.length > 0 && (
                            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                {prompts.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                    <MapTimeline />
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Privacy Zones</h3>
                            <p className="text-sm text-muted-foreground">
                                Create zones where location tracking is automatically disabled.
                                This ensures your private locations like home or work remain private.
                            </p>
                            <PrivacyZoneManager />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-lg border">
                            <h3 className="text-lg font-medium mb-4">How Privacy Works</h3>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex gap-2">
                                    <Shield className="h-5 w-5 text-green-600 shrink-0" />
                                    <span>Your location data is encrypted and stored securely.</span>
                                </li>
                                <li className="flex gap-2">
                                    <Shield className="h-5 w-5 text-green-600 shrink-0" />
                                    <span>Tracking is automatically disabled within your Privacy Zones.</span>
                                </li>
                                <li className="flex gap-2">
                                    <Shield className="h-5 w-5 text-green-600 shrink-0" />
                                    <span>You can delete your location history at any time.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {prompts.length === 0 ? (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No Pending Prompts</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                                    You're all caught up! Visit new places to receive context-aware questions about your experiences.
                                </p>
                            </div>
                        ) : (
                            prompts.map((prompt) => (
                                <LocationPromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    onAnswered={loadPrompts}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
