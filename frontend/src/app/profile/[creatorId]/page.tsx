import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Calendar, MapPin } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

interface CreatorProfileProps {
    params: Promise<{
        creatorId: string;
    }>;
}

export default async function CreatorProfilePage({ params }: CreatorProfileProps) {
    const { creatorId } = await params;
    // TODO: Fetch creator data from API
    const creator = {
        id: creatorId,
        name: "John Doe",
        bio: "Sharing my life story through digital memories and experiences.",
        avatar: "/placeholder-avatar.jpg",
        coverImage: "/placeholder-cover.jpg",
        location: "San Francisco, CA",
        joinedDate: "January 2024",
        stats: {
            subscribers: 0,
            chapters: 0,
            posts: 0,
        },
        tiers: [
            { id: '1', name: 'Free', price: 0, features: ['Sample chapters', 'Public profile'] },
            { id: '2', name: 'Bronze', price: 9.99, features: ['Full biography access'] },
            { id: '3', name: 'Gold', price: 29.99, features: ['Full biography', 'Diary insights'] },
        ],
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="space-y-6">
                    {/* Cover Image */}
                    <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative rounded-lg -mx-6 -mt-6">
                        <div className="absolute inset-0 bg-black/20 rounded-lg" />
                    </div>

                    {/* Profile Header */}
                    <div className="bg-background rounded-lg shadow-lg p-6 -mt-16 relative z-10">
                        <div className="flex flex-col md:flex-row gap-6">
                            <Avatar className="h-32 w-32 border-4 border-background">
                                <AvatarImage src={creator.avatar} alt={creator.name} />
                                <AvatarFallback>{creator.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">{creator.name}</h1>
                                <p className="text-muted-foreground mb-4">{creator.bio}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {creator.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Joined {creator.joinedDate}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div>
                                        <span className="font-bold">{creator.stats.subscribers}</span>
                                        <span className="text-muted-foreground ml-1">Subscribers</span>
                                    </div>
                                    <div>
                                        <span className="font-bold">{creator.stats.chapters}</span>
                                        <span className="text-muted-foreground ml-1">Chapters</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button size="lg">Subscribe</Button>
                                <Button variant="outline" size="lg">
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Read Biography
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Tiers */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Subscription Tiers</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {creator.tiers.map((tier) => (
                                <Card key={tier.id} className={tier.price === 0 ? '' : 'border-blue-300'}>
                                    <CardHeader>
                                        <CardTitle>{tier.name}</CardTitle>
                                        <CardDescription>
                                            <span className="text-3xl font-bold">${tier.price}</span>
                                            {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 mb-4">
                                            {tier.features.map((feature, index) => (
                                                <li key={index} className="text-sm flex items-start">
                                                    <span className="mr-2">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button className="w-full" variant={tier.price === 0 ? 'outline' : 'default'}>
                                            {tier.price === 0 ? 'Current Plan' : 'Subscribe'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Sample Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sample Chapters</CardTitle>
                            <CardDescription>Preview what's inside this biography</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                No public chapters available yet. Subscribe to access the full biography.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
