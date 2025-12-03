'use client';

import { useState, useEffect } from 'react';
import { Player } from '@remotion/player';
import { CinematicTemplate } from '@/remotion/templates/Cinematic';
import { FastPacedTemplate } from '@/remotion/templates/FastPaced';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Share2, Music, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';

interface SnippetEditorProps {
    chapterId: string;
    initialData?: any;
}

export function SnippetEditor({ chapterId, initialData }: SnippetEditorProps) {
    const [template, setTemplate] = useState<'cinematic' | 'fast-paced'>('cinematic');
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [compositionData, setCompositionData] = useState<any>(null);

    useEffect(() => {
        loadCompositionData();
    }, [chapterId]);

    const loadCompositionData = async () => {
        setLoading(true);
        try {
            // In a real app, we'd fetch highlights here
            // For now, we'll use mock data or initialData
            const mockImages = [
                'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
                'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
                'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80',
            ];

            setCompositionData({
                title: 'My Chapter Highlights',
                images: mockImages,
                primaryColor: '#ffffff',
            });
        } catch (error) {
            console.error('Failed to load composition data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setGenerating(true);
        try {
            // Call backend to generate video
            await api.post('/viral/snippets/generate', {
                chapterId,
                templateId: template,
                data: compositionData
            });
            // Simulate wait
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Video generated! (Mock)');
        } catch (error) {
            console.error('Failed to generate video:', error);
        } finally {
            setGenerating(false);
        }
    };

    if (loading || !compositionData) {
        return (
            <div className="flex h-[600px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const TemplateComponent = template === 'cinematic' ? CinematicTemplate : FastPacedTemplate;
    const durationInFrames = template === 'cinematic' ? 450 : 300;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Preview Area */}
            <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                <div className="aspect-[9/16] h-full max-h-[600px] w-auto relative shadow-2xl">
                    <Player
                        component={TemplateComponent}
                        durationInFrames={durationInFrames}
                        compositionWidth={1080}
                        compositionHeight={1920}
                        fps={30}
                        controls
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        inputProps={compositionData}
                    />
                </div>
            </div>

            {/* Controls Area */}
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Template</h3>
                            <Tabs value={template} onValueChange={(v: string) => setTemplate(v as any)}>
                                <TabsList className="w-full">
                                    <TabsTrigger value="cinematic" className="flex-1">Cinematic</TabsTrigger>
                                    <TabsTrigger value="fast-paced" className="flex-1">Fast Paced</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Music</h3>
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Music className="h-4 w-4" />
                                Select Track
                            </Button>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">AI Magic</h3>
                            <Button variant="secondary" className="w-full gap-2" onClick={loadCompositionData}>
                                <Wand2 className="h-4 w-4" />
                                Regenerate Highlights
                            </Button>
                        </div>

                        <div className="pt-6 border-t space-y-3">
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={handleExport}
                                disabled={generating}
                            >
                                {generating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Export Video
                            </Button>
                            <Button variant="outline" className="w-full gap-2">
                                <Share2 className="h-4 w-4" />
                                Share Preview
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
