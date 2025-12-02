'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Location {
    id: string;
    type: 'content' | 'feed';
    label: string;
    location: string; // "City, Country" or similar
    date: string;
    mood?: string;
    // In a real app, we'd need lat/lng coordinates.
    // For this MVP, we will simulate lat/lng based on a hash of the location string
    // or use a geocoding service. Since we don't have geocoding, we'll randomize/hash for demo.
    lat?: number;
    lng?: number;
}

export function MemoryMap() {
    const svgRef = useRef<SVGSVGElement>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [geoRes, locRes] = await Promise.all([
                fetch('/world.geojson').then(r => r.json()),
                api.get('/rewind/map')
            ]);

            const rawLocations = locRes.data;
            // Simulate coordinates for demo purposes since we store location as string
            const locationsWithCoords = rawLocations.map((loc: any) => {
                // Simple hash to deterministic pseudo-random coordinates
                const hash = loc.location.split('').reduce((a: number, b: string) => {
                    a = ((a << 5) - a) + b.charCodeAt(0);
                    return a & a;
                }, 0);

                // Map hash to reasonable lat/lng ranges
                // Lat: -60 to 70, Lng: -120 to 150 (roughly populated areas)
                const lat = (Math.abs(hash) % 130) - 60;
                const lng = (Math.abs(hash >> 16) % 270) - 120;

                return { ...loc, lat, lng };
            });

            setLocations(locationsWithCoords);
            drawMap(geoRes, locationsWithCoords);
        } catch (error) {
            console.error('Failed to load map data:', error);
        } finally {
            setLoading(false);
        }
    };

    const drawMap = (geoData: any, locationData: Location[]) => {
        if (!svgRef.current) return;

        const width = 800;
        const height = 500;
        const svg = d3.select(svgRef.current);

        svg.selectAll("*").remove(); // Clear previous

        // Projection
        const projection = d3.geoMercator()
            .scale(120)
            .center([0, 20])
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Draw Countries
        svg.append("g")
            .selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", path as any)
            .attr("fill", "#2d2d2d")
            .attr("stroke", "#404040")
            .attr("stroke-width", 0.5)
            .style("opacity", 0.8);

        // Draw Points
        svg.append("g")
            .selectAll("circle")
            .data(locationData)
            .join("circle")
            .attr("cx", d => projection([d.lng!, d.lat!])![0])
            .attr("cy", d => projection([d.lng!, d.lat!])![1])
            .attr("r", 6)
            .attr("fill", "#8b5cf6") // Violet-500
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 10)
                    .attr("fill", "#a78bfa"); // Violet-400

                setSelectedLocation(d);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 6)
                    .attr("fill", "#8b5cf6");
            });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px] bg-zinc-900 rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-[600px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
            <div className="absolute top-4 left-4 z-10">
                <Button variant="outline" size="sm" onClick={() => router.back()} className="bg-black/50 backdrop-blur-md border-zinc-700 text-white hover:bg-black/70">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className="w-full h-full flex items-center justify-center bg-black">
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox="0 0 800 500"
                    className="w-full h-full"
                />
            </div>

            {selectedLocation && (
                <Card className="absolute bottom-6 left-6 w-80 bg-black/80 backdrop-blur-md border-zinc-800 text-white p-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                            <MapPin className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">{selectedLocation.location}</h4>
                            <p className="text-xs text-zinc-400 mt-1 mb-2">
                                {new Date(selectedLocation.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-zinc-200 line-clamp-2">
                                {selectedLocation.label}
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
