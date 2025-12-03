'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Shield } from 'lucide-react';

interface PrivacyZone {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    trackingDisabled: boolean;
}

export function PrivacyZoneManager() {
    const [zones, setZones] = useState<PrivacyZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [newZone, setNewZone] = useState({
        name: '',
        radius: 100,
        trackingDisabled: true
    });

    useEffect(() => {
        loadZones();
    }, []);

    const loadZones = async () => {
        try {
            const res = await api.get('/location/privacy-zones');
            setZones(res.data);
        } catch (error) {
            console.error('Failed to load privacy zones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateZone = async () => {
        if (!newZone.name) return;

        try {
            // For MVP, we'll use a mock location or browser location
            // In real app, this would use a map picker
            const mockLat = 37.7749;
            const mockLng = -122.4194;

            await api.post('/location/privacy-zone', {
                ...newZone,
                latitude: mockLat,
                longitude: mockLng,
            });

            toast.success('Privacy zone created');
            setNewZone({ name: '', radius: 100, trackingDisabled: true });
            loadZones();
        } catch (error) {
            toast.error('Failed to create privacy zone');
        }
    };

    const handleDeleteZone = async (id: string) => {
        try {
            await api.delete(`/location/privacy-zone/${id}`);
            toast.success('Privacy zone deleted');
            setZones(zones.filter(z => z.id !== id));
        } catch (error) {
            toast.error('Failed to delete privacy zone');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>Privacy Zones</CardTitle>
                </div>
                <CardDescription>
                    Define areas where location tracking should be automatically disabled (e.g., Home, Work).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Create New Zone */}
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New Zone
                    </h3>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="zone-name">Zone Name</Label>
                            <Input
                                id="zone-name"
                                placeholder="e.g., Home"
                                value={newZone.name}
                                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="disable-tracking">Disable Tracking in Zone</Label>
                            <Switch
                                id="disable-tracking"
                                checked={newZone.trackingDisabled}
                                onCheckedChange={(checked) => setNewZone({ ...newZone, trackingDisabled: checked })}
                            />
                        </div>
                        <Button onClick={handleCreateZone} disabled={!newZone.name}>
                            Create Zone
                        </Button>
                    </div>
                </div>

                {/* Existing Zones */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Active Zones</h3>
                    {zones.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No privacy zones defined.</p>
                    ) : (
                        zones.map((zone) => (
                            <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <MapPin className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{zone.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {zone.radius}m radius • {zone.trackingDisabled ? 'Tracking Disabled' : 'Tracking Enabled'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteZone(zone.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
