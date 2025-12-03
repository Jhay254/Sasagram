'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Bell, Calendar, Sparkles, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: string;
    read: boolean;
    createdAt: string;
}

export function NotificationCenter() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            loadNotifications();
        }
    }, [open]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/engagement/notifications', {
                params: { limit: 10 }
            });
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        try {
            // Mark as read
            await api.post(`/engagement/notifications/${notification.id}/track`, {
                action: 'clicked'
            });

            // Navigate based on type
            if (notification.type === 'on_this_day' || notification.type === 'random_memory') {
                router.push('/rewind');
            }

            setOpen(false);
        } catch (error) {
            console.error('Failed to track notification:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'on_this_day':
                return <Calendar className="h-4 w-4 text-blue-500" />;
            case 'random_memory':
                return <Sparkles className="h-4 w-4 text-purple-500" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {unreadCount} new
                        </Badge>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                No notifications yet
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                                        !notification.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm">
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
