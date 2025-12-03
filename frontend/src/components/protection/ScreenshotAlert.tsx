'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ScreenshotWarning {
    id: string;
    contentId: string;
    detectedAt: string;
    creator: {
        name: string | null;
    };
}

export function ScreenshotAlert() {
    const [warnings, setWarnings] = useState<ScreenshotWarning[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWarnings();
    }, []);

    const loadWarnings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/protection/screenshot/warnings');
            setWarnings(res.data.warnings);
            setCount(res.data.count);
        } catch (error) {
            console.error('Failed to load warnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        if (count === 0) return 'text-green-600';
        if (count < 3) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusIcon = () => {
        if (count === 0) return <CheckCircle className="h-5 w-5 text-green-600" />;
        if (count < 3) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        return <Shield className="h-5 w-5 text-red-600" />;
    };

    if (loading) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <CardTitle>Screenshot Protection</CardTitle>
                    </div>
                    <Badge variant={count >= 3 ? 'destructive' : count > 0 ? 'secondary' : 'default'}>
                        {count}/3 Warnings
                    </Badge>
                </div>
                <CardDescription>
                    {count === 0 && 'No screenshot violations detected'}
                    {count > 0 && count < 3 && 'You have received screenshot warnings'}
                    {count >= 3 && 'Maximum warnings reached - access may be restricted'}
                </CardDescription>
            </CardHeader>
            {warnings.length > 0 && (
                <CardContent>
                    <div className="space-y-3">
                        {warnings.slice(0, 5).map((warning) => (
                            <div key={warning.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                <div>
                                    <p className="text-sm font-medium">
                                        Content from {warning.creator.name || 'Unknown Creator'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(warning.detectedAt).toLocaleString()}
                                    </p>
                                </div>
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </div>
                        ))}
                    </div>
                    {count >= 3 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                                <strong>Warning:</strong> You have reached the maximum number of screenshot violations.
                                Further violations may result in permanent access restrictions.
                            </p>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
