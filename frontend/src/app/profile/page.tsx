'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    router.push(`/profile/${user.id}`);
                    return;
                }
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }

        // If no user found or invalid data, redirect to login
        router.push('/login');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
    );
}
