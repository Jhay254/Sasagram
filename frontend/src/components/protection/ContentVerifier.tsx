'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VerificationResult {
    verified: boolean;
    blockchain?: string;
    timestamp?: string;
    message: string;
}

export function ContentVerifier() {
    const [hash, setHash] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);

    const handleVerify = async () => {
        if (!hash.trim()) {
            toast.error('Please enter a content hash');
            return;
        }

        setVerifying(true);
        setResult(null);

        try {
            const res = await api.get(`/protection/blockchain/verify/${hash}`);
            setResult(res.data);
        } catch (error) {
            console.error('Verification failed:', error);
            toast.error('Failed to verify content');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>Content Verifier</CardTitle>
                </div>
                <CardDescription>
                    Verify the authenticity of content using blockchain technology
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter content hash (SHA-256)"
                        value={hash}
                        onChange={(e) => setHash(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    <Button onClick={handleVerify} disabled={verifying}>
                        {verifying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {result && (
                    <div className={`p-4 rounded-lg border ${result.verified
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-start gap-3">
                            {result.verified ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className={`font-semibold ${result.verified ? 'text-green-900' : 'text-red-900'
                                    }`}>
                                    {result.verified ? 'Content Verified ✓' : 'Verification Failed'}
                                </p>
                                <p className={`text-sm mt-1 ${result.verified ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {result.message}
                                </p>
                                {result.verified && result.blockchain && (
                                    <div className="mt-3 space-y-1 text-xs text-green-700">
                                        <p><strong>Blockchain:</strong> {result.blockchain}</p>
                                        {result.timestamp && (
                                            <p><strong>Verified On:</strong> {new Date(result.timestamp).toLocaleString()}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-xs text-muted-foreground space-y-2">
                    <p><strong>How it works:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Each piece of content is hashed using SHA-256</li>
                        <li>The hash is stored on the Polygon blockchain</li>
                        <li>Anyone can verify content authenticity using the hash</li>
                        <li>Verified content cannot be tampered with</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
