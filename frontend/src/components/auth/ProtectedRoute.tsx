'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    redirectTo?: string;
}

export function ProtectedRoute({
    children,
    requireAuth = true,
    redirectTo = '/login'
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && requireAuth && !isAuthenticated) {
            // Store the current path to redirect back after login
            const currentPath = window.location.pathname;
            router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Don't render children if not authenticated and auth is required
    if (requireAuth && !isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
