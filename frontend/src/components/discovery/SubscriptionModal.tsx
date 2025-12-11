'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, X } from 'lucide-react';
import { SubscriptionTier } from '@/lib/types/discovery.types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    creator: {
        id: string;
        displayName: string;
        username: string;
        avatar: string;
    };
    tiers: SubscriptionTier[];
}

type PaymentMethod = 'paypal' | 'stripe';

export function SubscriptionModal({ isOpen, onClose, creator, tiers }: SubscriptionModalProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleTierSelect = (tier: SubscriptionTier) => {
        setSelectedTier(tier);
        setError('');
    };

    const handlePaymentMethodChange = (method: PaymentMethod) => {
        if (method === 'stripe') {
            // Stripe is coming soon
            return;
        }
        setPaymentMethod(method);
    };

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            // Redirect to login
            router.push(`/login?redirect=/discover`);
            return;
        }

        if (!selectedTier) {
            setError('Please select a subscription tier');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // This will be implemented with PayPal SDK
            console.log('Subscribing to:', {
                creatorId: creator.id,
                tierId: selectedTier.id,
                paymentMethod,
            });

            // TODO: Integrate PayPal payment flow
            // For now, just show success message
            alert('Payment integration coming soon!');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Subscription failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Subscribe to {creator.displayName}
                    </DialogTitle>
                    <DialogDescription>
                        Choose a tier and payment method to get exclusive access
                    </DialogDescription>
                </DialogHeader>

                {/* Tier Selection */}
                <div className="space-y-4 mt-6">
                    <h3 className="font-semibold text-lg">Select a Tier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {tiers.map((tier) => (
                            <button
                                key={tier.id}
                                onClick={() => handleTierSelect(tier)}
                                className={`relative p-6 rounded-lg border-2 transition-all text-left ${selectedTier?.id === tier.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-primary/50'
                                    } ${tier.isPopular ? 'ring-2 ring-primary' : ''}`}
                            >
                                {tier.isPopular && (
                                    <Badge className="absolute -top-2 -right-2 bg-primary">
                                        Most Popular
                                    </Badge>
                                )}

                                <div className="space-y-3">
                                    <h4 className="font-bold text-xl">{tier.name}</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">${tier.price}</span>
                                        <span className="text-gray-500">/month</span>
                                    </div>

                                    <ul className="space-y-2 mt-4">
                                        {tier.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm">
                                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Tier Summary */}
                {selectedTier && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{selectedTier.name} Tier</p>
                                <p className="text-sm text-gray-600">
                                    Billed monthly • Cancel anytime
                                </p>
                            </div>
                            <p className="text-2xl font-bold">${selectedTier.price}/mo</p>
                        </div>
                    </div>
                )}

                {/* Payment Method Selection */}
                {selectedTier && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Payment Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* PayPal */}
                            <button
                                onClick={() => handlePaymentMethodChange('paypal')}
                                className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'paypal'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                                        PP
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold">PayPal</p>
                                        <p className="text-xs text-gray-500">Fast & secure</p>
                                    </div>
                                </div>
                            </button>

                            {/* Stripe - Coming Soon */}
                            <div className="relative">
                                <button
                                    disabled
                                    className="w-full p-4 rounded-lg border-2 border-gray-200 opacity-50 cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-600 rounded flex items-center justify-center">
                                            <CreditCard className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">Credit Card</p>
                                            <p className="text-xs text-gray-500">Visa, Mastercard, etc.</p>
                                        </div>
                                    </div>
                                </button>
                                <Badge className="absolute -top-2 -right-2 bg-blue-500">
                                    Coming Soon
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubscribe}
                        className="flex-1"
                        disabled={!selectedTier || isProcessing}
                    >
                        {isProcessing ? 'Processing...' : `Subscribe with ${paymentMethod === 'paypal' ? 'PayPal' : 'Card'}`}
                    </Button>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center mt-4">
                    By subscribing, you agree to our{' '}
                    <a href="/terms" className="underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="underline">Privacy Policy</a>.
                    You can cancel your subscription at any time.
                </p>
            </DialogContent>
        </Dialog>
    );
}
