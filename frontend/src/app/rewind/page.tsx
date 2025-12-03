'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RewindContainer } from '@/components/rewind/RewindContainer';

export default function RewindPage() {
    return (
        <ProtectedRoute>
            <RewindContainer />
        </ProtectedRoute>
    );
}
