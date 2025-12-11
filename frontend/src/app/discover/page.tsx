'use client';

import { useState, useCallback, useEffect } from 'react';
import { Creator, FilterTab, Category } from '@/lib/types/discovery.types';
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { fetchCreators, searchCreators } from '@/lib/services/discovery.service';
import { CreatorCard } from '@/components/discovery/CreatorCard';
import { CreatorCardSkeleton } from '@/components/discovery/CreatorCardSkeleton';
import { FilterTabs } from '@/components/discovery/FilterTabs';
import { SearchInterface } from '@/components/discovery/SearchInterface';
import { OnboardingModal } from '@/components/discovery/OnboardingModal';
import { CreatorPreviewModal } from '@/components/discovery/CreatorPreviewModal';
import { MobileNav } from '@/components/layout/MobileNav';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiscoverPage() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [activeTab, setActiveTab] = useState<FilterTab>('for-you');
    const [activeCategory, setActiveCategory] = useState<Category | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [previewCreator, setPreviewCreator] = useState<Creator | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        preferences,
        showOnboarding,
        updateInterests,
        updateLifeStage,
        completeOnboarding,
        skipOnboarding,
    } = useOnboarding();

    // Load initial creators
    useEffect(() => {
        if (!searchQuery) {
            loadInitialCreators();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, activeCategory, preferences.completedOnboarding, searchQuery]);

    const loadInitialCreators = async () => {
        setIsLoading(true);
        setError(null);
        setCurrentPage(1);
        try {
            const response = await fetchCreators({
                tab: activeTab,
                category: activeCategory,
                preferences: preferences.completedOnboarding ? preferences : undefined,
                page: 1,
                limit: 10,
            });
            setCreators(response.creators);
            setHasMore(response.hasMore);
        } catch (err) {
            console.error('Error loading creators:', err);
            setError('Failed to load creators. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        const nextPage = currentPage + 1;

        try {
            const response = await fetchCreators({
                tab: activeTab,
                category: activeCategory,
                preferences: preferences.completedOnboarding ? preferences : undefined,
                page: nextPage,
                limit: 10,
            });
            setCreators((prev) => [...prev, ...response.creators]);
            setHasMore(response.hasMore);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Error loading more creators:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, activeCategory, preferences, currentPage, isLoading, hasMore]);

    const { loadMoreRef } = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        isLoading,
    });

    const handleTabChange = (tab: FilterTab) => {
        setActiveTab(tab);
        setActiveCategory(undefined);
    };

    const handleCategoryChange = (category: Category) => {
        setActiveCategory(category);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setIsSearchOpen(false);

        if (!query.trim()) {
            loadInitialCreators();
            return;
        }

        setIsSearching(true);
        setIsLoading(true);
        setError(null);
        try {
            const response = await searchCreators(query, 1, 10);
            setCreators(response.creators);
            setHasMore(response.hasMore);
            setCurrentPage(1);
        } catch (err) {
            console.error('Error searching creators:', err);
            setError('Search failed. Please try again.');
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        loadInitialCreators();
    };

    const handlePreview = (creator: Creator) => {
        setPreviewCreator(creator);
    };

    const handleSubscribe = (creator: Creator) => {
        console.log('Subscribe to creator:', creator.id);
        // TODO: Navigate to subscription flow
    };

    const handleOnboardingComplete = (prefs: Partial<typeof preferences>) => {
        if (prefs.interests) updateInterests(prefs.interests);
        if (prefs.lifeStage) updateLifeStage(prefs.lifeStage);
        completeOnboarding();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header onSearchClick={() => setIsSearchOpen(true)} />

            {/* Filter Tabs */}
            <FilterTabs
                activeTab={activeTab}
                activeCategory={activeCategory}
                onTabChange={handleTabChange}
                onCategoryChange={handleCategoryChange}
            />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="mx-auto max-w-3xl space-y-8">
                    {/* Search Results Header */}
                    {searchQuery && (
                        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                            <p className="text-sm">
                                {isSearching ? (
                                    'Searching...'
                                ) : (
                                    <>
                                        Showing results for <span className="font-semibold">&quot;{searchQuery}&quot;</span>
                                        {creators.length > 0 && ` (${creators.length} ${creators.length === 1 ? 'creator' : 'creators'})`}
                                    </>
                                )}
                            </p>
                            <Button variant="ghost" size="sm" onClick={clearSearch}>
                                Clear Search
                            </Button>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
                            <p className="font-medium">⚠️ {error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => searchQuery ? handleSearch(searchQuery) : loadInitialCreators()}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Show personalization hint for "For You" tab */}
                    {activeTab === 'for-you' && preferences.completedOnboarding && preferences.interests.length > 0 && !searchQuery && (
                        <div className="rounded-lg bg-gradient-to-r from-amber-50 to-teal-50 p-4 text-sm">
                            <p className="font-medium text-gray-700">
                                🔥 Personalized for you based on your interests:{' '}
                                {preferences.interests.map((i) => i.replace('-', ' ')).join(', ')}
                            </p>
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {creators.map((creator, index) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                layout
                            >
                                <CreatorCard
                                    creator={creator}
                                    onPreview={handlePreview}
                                    onSubscribe={handleSubscribe}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading Skeletons */}
                    {isLoading && (
                        <>
                            {[1, 2, 3].map((i) => (
                                <CreatorCardSkeleton key={i} />
                            ))}
                        </>
                    )}

                    {/* Infinite Scroll Trigger */}
                    <div ref={loadMoreRef} className="h-10" />

                    {!hasMore && creators.length > 0 && (
                        <p className="py-8 text-center text-muted-foreground">
                            You&apos;ve reached the end! Check back later for more creators.
                        </p>
                    )}

                    {!isLoading && creators.length === 0 && (
                        <div className="py-16 text-center">
                            <p className="text-lg text-muted-foreground">
                                No creators found. Try adjusting your filters.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <SearchInterface
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSearch={handleSearch}
            />

            <OnboardingModal
                isOpen={showOnboarding}
                onComplete={handleOnboardingComplete}
                onSkip={skipOnboarding}
            />

            <CreatorPreviewModal
                creator={previewCreator}
                isOpen={previewCreator !== null}
                onClose={() => setPreviewCreator(null)}
                onSubscribe={handleSubscribe}
            />

            <MobileNav />
        </div>
    );
}
