'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Users } from 'lucide-react';

interface ReferralStats {
    code: string | null;
    totalReferrals: number;
    referrals: Array<{
        user: string;
        date: string;
        status: string;
    }>;
}

export function ReferralCard() {
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await api.get('/referral/code');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load referral stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (stats?.code) {
            navigator.clipboard.writeText(stats.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareReferral = () => {
        if (stats?.code) {
            const url = `${window.location.origin}/signup?ref=${stats.code}`;
            const text = `Join me on Sasagram and preserve your memories! Use my code: ${stats.code}`;

            if (navigator.share) {
                navigator.share({ title: 'Join Sasagram', text, url });
            } else {
                navigator.clipboard.writeText(`${text}\n${url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    if (loading) {
        return (
            <Card className="p-6 bg-zinc-900 border-zinc-800 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-1/2 mb-4" />
                <div className="h-12 bg-zinc-800 rounded mb-4" />
                <div className="h-10 bg-zinc-800 rounded" />
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">Invite Friends</h3>
                    <p className="text-sm text-zinc-400">Share your unique referral code</p>
                </div>
            </div>

            {stats?.code && (
                <>
                    <div className="flex gap-2 mb-4">
                        <Input
                            value={stats.code}
                            readOnly
                            className="bg-black/30 border-violet-500/30 text-white font-mono text-lg text-center"
                        />
                        <Button
                            onClick={copyCode}
                            variant="outline"
                            size="icon"
                            className="border-violet-500/30 hover:bg-violet-500/20"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-400" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    <Button
                        onClick={shareReferral}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Referral Link
                    </Button>

                    <div className="mt-6 pt-6 border-t border-violet-500/20">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Total Referrals</span>
                            <span className="text-xl font-bold text-violet-400">{stats.totalReferrals}</span>
                        </div>

                        {stats.referrals.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs text-zinc-500 uppercase tracking-wide">Recent</p>
                                {stats.referrals.slice(0, 3).map((ref, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-300">{ref.user}</span>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(ref.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </Card>
    );
}
