'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Mock data
const revenueData = [
    { month: 'Jan', revenue: 0, subscribers: 0 },
    { month: 'Feb', revenue: 0, subscribers: 0 },
    { month: 'Mar', revenue: 0, subscribers: 0 },
    { month: 'Apr', revenue: 0, subscribers: 0 },
    { month: 'May', revenue: 0, subscribers: 0 },
    { month: 'Jun', revenue: 0, subscribers: 0 },
];

const transactions: any[] = [
    // Mock transactions will go here
];

export default function RevenuePage() {
    const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
    const pendingPayout = 0; // TODO: Fetch from API

    const handleRequestPayout = async () => {
        // TODO: Implement payout request
        console.log('Requesting payout');
        setPayoutDialogOpen(false);
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
                            <p className="text-muted-foreground">
                                Track your earnings and manage payouts
                            </p>
                        </div>
                        <Button onClick={() => setPayoutDialogOpen(true)} disabled={pendingPayout < 50}>
                            <Download className="mr-2 h-4 w-4" />
                            Request Payout
                        </Button>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$0</div>
                                <p className="text-xs text-muted-foreground">
                                    All time
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$0</div>
                                <p className="text-xs text-muted-foreground">
                                    Monthly Recurring Revenue
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-green-600">+0%</span> from last month
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${pendingPayout.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Min: $50
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Your monthly revenue over the last 6 months</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Subscriber Growth</CardTitle>
                                <CardDescription>New subscribers per month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="subscribers" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Recent payments and payouts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No transactions yet. Start earning by getting subscribers!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((transaction: any) => (
                                        <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                                            <div>
                                                <p className="font-medium">{transaction.description}</p>
                                                <p className="text-sm text-muted-foreground">{transaction.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">${transaction.amount}</p>
                                                <Badge variant="outline">{transaction.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payout Request Dialog */}
                <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Payout</DialogTitle>
                            <DialogDescription>
                                Request a payout of your pending earnings
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    <strong>Pending Amount:</strong> ${pendingPayout.toFixed(2)}
                                </p>
                                <p className="text-sm text-blue-900 mt-2">
                                    <strong>Your Share (40%):</strong> ${(pendingPayout * 0.4).toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-700 mt-2">
                                    Payouts are processed via PayPal within 3-5 business days.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleRequestPayout}>
                                Confirm Payout
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppLayout>
        </ProtectedRoute>
    );
}
