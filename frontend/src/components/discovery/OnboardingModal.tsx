'use client';

import { useState } from 'react';
import { Category, UserPreferences } from '@/lib/types/discovery.types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: (preferences: Partial<UserPreferences>) => void;
    onSkip: () => void;
}

const categories: { value: Category; label: string; icon: string }[] = [
    { value: 'career-business', label: 'Career & Business', icon: '💼' },
    { value: 'creative-arts', label: 'Creative & Arts', icon: '🎨' },
    { value: 'health-fitness', label: 'Health & Fitness', icon: '🏃' },
    { value: 'travel-adventure', label: 'Travel & Adventure', icon: '🌍' },
    { value: 'personal-growth', label: 'Personal Growth', icon: '📚' },
    { value: 'relationships-family', label: 'Relationships & Family', icon: '💑' },
    { value: 'technology-innovation', label: 'Technology & Innovation', icon: '🔧' },
    { value: 'politics-government', label: 'Politics & Government', icon: '🏛️' },
    { value: 'lifestyle-culture', label: 'Lifestyle & Culture', icon: '🏠' },
];

const lifeStages: { value: UserPreferences['lifeStage']; label: string; description: string }[] = [
    { value: 'student', label: '18-24', description: 'Student/Early Career' },
    { value: 'early-career', label: '25-34', description: 'Establishing Career' },
    { value: 'mid-career', label: '35-44', description: 'Mid-Career/Family Building' },
    { value: 'peak-career', label: '45-54', description: 'Peak Career/Empty Nest' },
    { value: 'late-career', label: '55+', description: 'Late Career/Retirement' },
];

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [selectedInterests, setSelectedInterests] = useState<Category[]>([]);
    const [selectedLifeStage, setSelectedLifeStage] = useState<UserPreferences['lifeStage']>('mid-career');

    const toggleInterest = (category: Category) => {
        setSelectedInterests((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const handleContinue = () => {
        if (step === 1) {
            setStep(2);
        } else {
            onComplete({
                interests: selectedInterests,
                lifeStage: selectedLifeStage,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">👋 Welcome to Sasagram!</DialogTitle>
                    <DialogDescription>
                        Help us find stories you&apos;ll love
                    </DialogDescription>
                </DialogHeader>

                {step === 1 ? (
                    <div className="space-y-4">
                        <p className="font-medium">What are you interested in? (Select all that apply)</p>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {categories.map((category) => (
                                <button
                                    key={category.value}
                                    onClick={() => toggleInterest(category.value)}
                                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${selectedInterests.includes(category.value)
                                        ? 'border-[#008B8B] bg-[#008B8B]/10'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-3xl">{category.icon}</span>
                                    <span className="text-center text-sm font-medium">{category.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="font-medium">What&apos;s your life stage?</p>
                        <RadioGroup value={selectedLifeStage} onValueChange={(value: string) => setSelectedLifeStage(value as UserPreferences['lifeStage'])}>
                            <div className="space-y-3">
                                {lifeStages.map((stage) => (
                                    <div
                                        key={stage.value}
                                        className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent"
                                    >
                                        <RadioGroupItem value={stage.value} id={stage.value} />
                                        <Label htmlFor={stage.value} className="flex-1 cursor-pointer">
                                            <div className="font-medium">{stage.label}</div>
                                            <div className="text-sm text-muted-foreground">{stage.description}</div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>
                )}

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="ghost" onClick={onSkip}>
                        Skip
                    </Button>
                    <Button
                        onClick={handleContinue}
                        disabled={step === 1 && selectedInterests.length === 0}
                        className="bg-[#008B8B] hover:bg-[#006B6B]"
                    >
                        {step === 1 ? 'Continue' : 'Get Started'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
