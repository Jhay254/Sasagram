'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Instagram,
    Twitter,
    Facebook,
    Linkedin,
    Mail,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';

interface DataSource {
    id: string;
    name: string;
    icon: any;
    connected: boolean;
    lastSync?: string;
    status: 'active' | 'error' | 'syncing';
}

export default function DataSourcesPage() {
    const [sources, setSources] = useState<DataSource[]>([
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            connected: false,
            status: 'active',
        },
        {
            id: 'twitter',
            name: 'Twitter',
            icon: Twitter,
            connected: false,
            status: 'active',
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            connected: false,
            status: 'active',
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: Linkedin,
            connected: false,
            status: 'active',
        },
        {
            id: 'gmail',
            name: 'Gmail',
            icon: Mail,
            connected: false,
            status: 'active',
        },
    ]);

    const handleConnect = async (sourceId: string) => {
        // TODO: Implement OAuth flow
        console.log('Connecting to', sourceId);
        // Use absolute URL for backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        window.open(`${apiUrl}/oauth/${sourceId}`, '_blank', 'width=600,height=700');
    };

    const handleSync = async (sourceId: string) => {
        // TODO: Implement manual sync
        console.log('Syncing', sourceId);
    };

    const getStatusBadge = (status: string, connected: boolean) => {
        if (!connected) return null;

        switch (status) {
            case 'active':
                return <Badge variant="outline" className="text-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>;
            case 'error':
                return <Badge variant="outline" className="text-red-600"><XCircle className="mr-1 h-3 w-3" />Error</Badge>;
            case 'syncing':
                return <Badge variant="outline" className="text-blue-600"><Clock className="mr-1 h-3 w-3" />Syncing</Badge>;
            default:
                return null;
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
                        <p className="text-muted-foreground">
                            Connect your social media and email accounts to build your biography
                        </p>
                    </div>

                    {/* Storage Usage */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Storage Usage</CardTitle>
                            <CardDescription>Your current storage consumption</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>0 MB / 5 GB used</span>
                                    <span className="text-muted-foreground">0%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Sources Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sources.map((source) => {
                            const Icon = source.icon;
                            return (
                                <Card key={source.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Icon className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{source.name}</CardTitle>
                                                    {source.lastSync && (
                                                        <CardDescription className="text-xs">
                                                            Last sync: {source.lastSync}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                            {getStatusBadge(source.status, source.connected)}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            {source.connected ? (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleSync(source.id)}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Sync Now
                                                    </Button>
                                                    <Button variant="destructive" className="flex-1">
                                                        Disconnect
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    className="w-full"
                                                    onClick={() => handleConnect(source.id)}
                                                >
                                                    Connect
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
