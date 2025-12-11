'use client';

import { useState, useEffect } from 'react';
import { UrgencyOffer } from '@/lib/types/discovery.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Users, Zap } from 'lucide-react';

interface UrgencyBannerProps {
    offer: UrgencyOffer;
}

export function UrgencyBanner({ offer }: UrgencyBannerProps) {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only showing countdown after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return; // Don't run until mounted

        if (offer.type === 'limited-time' && offer.expiresAt) {
            const updateCountdown = () => {
                const now = new Date().getTime();
                const expiry = new Date(offer.expiresAt!).getTime();
                const distance = expiry - now;

                if (distance < 0) {
                    setTimeRemaining('Expired');
                    return;
                }

                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            };

            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);

            return () => clearInterval(interval);
        }
    }, [offer, mounted]);

    const getIcon = () => {
        switch (offer.type) {
            case 'limited-time':
                return <Clock className="h-4 w-4" />;
            case 'limited-spots':
                return <Users className="h-4 w-4" />;
            case 'recent-activity':
                return <Zap className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getBannerStyle = () => {
        switch (offer.type) {
            case 'limited-time':
                return 'border-orange-500 bg-orange-50 text-orange-900';
            case 'limited-spots':
                return 'border-red-500 bg-red-50 text-red-900';
            case 'recent-activity':
                return 'border-green-500 bg-green-50 text-green-900';
            default:
                return 'border-blue-500 bg-blue-50 text-blue-900';
        }
    };

    return (
        <Alert className={`${getBannerStyle()} border-l-4`}>
            <div className="flex items-center gap-2">
                {getIcon()}
                <AlertDescription className="flex-1 font-medium">
                    {offer.type === 'limited-time' && mounted && timeRemaining && (
                        <span className="mr-2 font-bold">⏰ {timeRemaining}</span>
                    )}
                    {offer.message}
                </AlertDescription>
            </div>
        </Alert>
    );
}
