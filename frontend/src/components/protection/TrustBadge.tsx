'use client';

import { Shield, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TrustBadgeProps {
    verified: boolean;
    hash?: string;
    blockchain?: string;
    transactionId?: string | null;
    timestamp?: Date;
}

export function TrustBadge({ verified, hash, blockchain, transactionId, timestamp }: TrustBadgeProps) {
    if (!verified) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                        <Shield className="h-3 w-3" />
                        <CheckCircle className="h-3 w-3" />
                        Verified
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                    <div className="space-y-2">
                        <p className="font-semibold">Blockchain Verified Content</p>
                        {hash && (
                            <p className="text-xs">
                                <strong>Hash:</strong> {hash}
                            </p>
                        )}
                        {blockchain && (
                            <p className="text-xs">
                                <strong>Blockchain:</strong> {blockchain}
                            </p>
                        )}
                        {transactionId && (
                            <p className="text-xs">
                                <strong>TX:</strong> {transactionId.substring(0, 16)}...
                            </p>
                        )}
                        {timestamp && (
                            <p className="text-xs">
                                <strong>Verified:</strong> {new Date(timestamp).toLocaleDateString()}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            This content has been cryptographically verified and stored on the blockchain,
                            ensuring its authenticity and preventing tampering.
                        </p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
