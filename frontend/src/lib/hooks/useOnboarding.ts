import { useState, useEffect } from 'react';
import { UserPreferences, Category } from '../types/discovery.types';

const ONBOARDING_KEY = 'sasagram-onboarding';

/**
 * Hook for managing user onboarding state and preferences
 */
export function useOnboarding() {
    const [preferences, setPreferences] = useState<UserPreferences>({
        interests: [],
        lifeStage: 'mid-career',
        completedOnboarding: false,
    });
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Load preferences from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(ONBOARDING_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as UserPreferences;
                setPreferences(parsed);
                setShowOnboarding(!parsed.completedOnboarding);
            } catch (error) {
                console.error('Failed to parse onboarding preferences:', error);
                setShowOnboarding(true);
            }
        } else {
            setShowOnboarding(true);
        }
    }, []);

    const updateInterests = (interests: Category[]) => {
        setPreferences((prev) => ({ ...prev, interests }));
    };

    const updateLifeStage = (
        lifeStage: UserPreferences['lifeStage']
    ) => {
        setPreferences((prev) => ({ ...prev, lifeStage }));
    };

    const completeOnboarding = () => {
        const updated = { ...preferences, completedOnboarding: true };
        setPreferences(updated);
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
        setShowOnboarding(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_KEY);
        setPreferences({
            interests: [],
            lifeStage: 'mid-career',
            completedOnboarding: false,
        });
        setShowOnboarding(true);
    };

    const skipOnboarding = () => {
        const updated = { ...preferences, completedOnboarding: true };
        setPreferences(updated);
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
        setShowOnboarding(false);
    };

    return {
        preferences,
        showOnboarding,
        updateInterests,
        updateLifeStage,
        completeOnboarding,
        resetOnboarding,
        skipOnboarding,
    };
}
