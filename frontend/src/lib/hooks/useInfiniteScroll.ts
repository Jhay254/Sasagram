import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
    threshold?: number; // Percentage of scroll before triggering (default: 0.8)
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
    isLoading: boolean;
}

/**
 * Hook for implementing infinite scroll functionality
 * Triggers onLoadMore when user scrolls to threshold percentage of the page
 */
export function useInfiniteScroll({
    threshold = 0.8,
    onLoadMore,
    hasMore,
    isLoading,
}: UseInfiniteScrollOptions) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Save scroll position for restoration
    const saveScrollPosition = useCallback(() => {
        setScrollPosition(window.scrollY);
        sessionStorage.setItem('discovery-scroll', window.scrollY.toString());
    }, []);

    // Restore scroll position
    const restoreScrollPosition = useCallback(() => {
        const saved = sessionStorage.getItem('discovery-scroll');
        if (saved) {
            window.scrollTo(0, parseInt(saved, 10));
        }
    }, []);

    // Handle intersection
    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading) {
                onLoadMore();
            }
        },
        [hasMore, isLoading, onLoadMore]
    );

    // Set up intersection observer
    useEffect(() => {
        if (!loadMoreRef.current) return;

        observerRef.current = new IntersectionObserver(handleIntersection, {
            root: null,
            rootMargin: '200px', // Start loading 200px before reaching the element
            threshold: 0.1,
        });

        observerRef.current.observe(loadMoreRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleIntersection]);

    // Restore scroll position on mount
    useEffect(() => {
        restoreScrollPosition();
    }, [restoreScrollPosition]);

    // Save scroll position on unmount
    useEffect(() => {
        return () => {
            saveScrollPosition();
        };
    }, [saveScrollPosition]);

    return {
        loadMoreRef,
        scrollPosition,
        saveScrollPosition,
        restoreScrollPosition,
    };
}
