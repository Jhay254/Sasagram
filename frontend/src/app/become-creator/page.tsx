'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function BecomeCreatorPage() {
    const { user, refreshToken } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.name?.toLowerCase().replace(/\s+/g, '') || '',
        displayName: user?.name || '',
        bio: '',
        category: 'lifestyle',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creators/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    username: formData.username,
                    displayName: formData.displayName,
                    bio: formData.bio,
                    categories: [formData.category],
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to onboard');
            }

            toast.success("Welcome to the Creator Community! 🎉", {
                description: "Your profile has been set up successfully.",
            });

            // Refresh auth context to update role
            await refreshToken();

            // Redirect to dashboard (or discover for now)
            router.push('/discover');
        } catch (error: any) {
            toast.error("Error", {
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Become a Creator</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Share your story, build your community, and start earning.
                        Join thousands of creators on Sasagram.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create Your Profile</CardTitle>
                        <CardDescription>
                            Set up your public creator profile. You can change this later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                    <Input
                                        id="username"
                                        placeholder="username"
                                        className="pl-8"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    This will be your unique handle on Sasagram.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    placeholder="Your Name"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="Tell your story..."
                                    className="h-32 resize-none"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Primary Category</Label>
                                <select
                                    id="category"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="lifestyle">Lifestyle</option>
                                    <option value="career-business">Career & Business</option>
                                    <option value="creative-arts">Creative Arts</option>
                                    <option value="tech">Technology</option>
                                    <option value="politics-government">Politics & Government</option>
                                    <option value="education">Education</option>
                                </select>
                            </div>

                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    What you get:
                                </h4>
                                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                                    <li>Public Creator Profile</li>
                                    <li>Ability to publish Chapters</li>
                                    <li>Monetization tools (Subscriptions)</li>
                                    <li>Analytics Dashboard</li>
                                </ul>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    'Start My Journey'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
