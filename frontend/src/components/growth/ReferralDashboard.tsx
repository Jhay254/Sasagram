'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, Copy, Share2, Gift, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralStats {
    code: string | null;
    totalReferrals: number;
    referrals: Array<{
        user: string;
        date: string;
        status: string;
    }>;
}

export function ReferralDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/referral/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to load referral stats:', error);
            toast.error('Failed to load referral data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/referral/generate');
            setStats({ ...stats!, code: res.data.code });
            toast.success('Referral code generated!');
        } catch (error) {
            console.error('Failed to generate code:', error);
            toast.error('Failed to generate referral code');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyCode = () => {
        if (stats?.code) {
            const referralUrl = `${window.location.origin}/signup?ref=${stats.code}`;
            navigator.clipboard.writeText(referralUrl);
            toast.success('Referral link copied to clipboard!');
        }
    };

    const handleShare = async () => {
        if (stats?.code && navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Sasagram',
                    text: 'Join me on Sasagram and preserve your life story!',
                    url: `${window.location.origin}/signup?ref=${stats.code}`,
                });
            } catch (error) {
                // User cancelled or share failed
                handleCopyCode();
            }
        } else {
            handleCopyCode();
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Referral Code</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {stats?.code ? (
                            <div className="space-y-2">
                                <div className="text-2xl font-bold font-mono">{stats.code}</div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={handleCopyCode}>
                                        <Copy className="mr-2 h-3 w-3" />
                                        Copy Link
                                    </Button>
                                    <Button size="sm" onClick={handleShare}>
                                        <Share2 className="mr-2 h-3 w-3" />
                                        Share
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button onClick={handleGenerateCode} disabled={generating}>
                                {generating ? 'Generating...' : 'Generate Code'}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Friends who joined using your code
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalReferrals || 0) * 10}</div>
                        <p className="text-xs text-muted-foreground">
                            Points earned from referrals
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Referral History */}
            <Card>
                <CardHeader>
                    <CardTitle>Referral History</CardTitle>
                    <CardDescription>People who joined using your referral code</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats?.referrals && stats.referrals.length > 0 ? (
                        <div className="space-y-4">
                            {stats.referrals.map((referral, index) => (
                                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{referral.user}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(referral.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                                        {referral.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No referrals yet. Share your code to get started!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
                <CardHeader>
                    <CardTitle>How Referrals Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            1
                        </div>
                        <p>Share your unique referral link with friends and family.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            2
                        </div>
                        <p>When they sign up using your link, you both earn rewards!</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            3
                        </div>
                        <p>Earn 10 points for each successful referral to unlock achievements.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
