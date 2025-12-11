import { useEffect, useRef, useState } from 'react';

interface UseViewportVideoOptions {
    threshold?: number; // Percentage of element visible to trigger (default: 0.5)
    autoPlay?: boolean; // Auto-play when in viewport (default: true)
    muted?: boolean; // Start muted (default: true)
}

/**
 * Hook for managing video playback based on viewport visibility
 * Auto-plays muted video when element enters viewport
 */
export function useViewportVideo({
    threshold = 0.5,
    autoPlay = true,
    muted = true,
}: UseViewportVideoOptions = {}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(muted);
    const [isInViewport, setIsInViewport] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsInViewport(entry.isIntersecting);

                    if (entry.isIntersecting && autoPlay) {
                        // Play video when entering viewport
                        video.muted = isMuted;
                        video.play().catch((error) => {
                            console.error('Video play failed:', error);
                        });
                        setIsPlaying(true);
                    } else {
                        // Pause video when leaving viewport
                        video.pause();
                        setIsPlaying(false);
                    }
                });
            },
            {
                threshold,
                rootMargin: '0px',
            }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
        };
    }, [autoPlay, isMuted, threshold]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            video.play().catch((error) => {
                console.error('Video play failed:', error);
            });
            setIsPlaying(true);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return {
        videoRef,
        isPlaying,
        isMuted,
        isInViewport,
        togglePlay,
        toggleMute,
    };
}
