'use client';

import { cn } from '@/lib/utils';

interface TimelineScrubberProps {
    years: number[];
    activeYear: number;
    onYearSelect: (year: number) => void;
}

export function TimelineScrubber({ years, activeYear, onYearSelect }: TimelineScrubberProps) {
    return (
        <div className="absolute right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-2 rounded-full bg-black/20 py-4 backdrop-blur-sm">
            {years.map((year) => (
                <button
                    key={year}
                    onClick={() => onYearSelect(year)}
                    className={cn(
                        "relative flex h-8 w-12 items-center justify-center text-xs font-medium transition-all",
                        activeYear === year
                            ? "scale-110 text-white font-bold"
                            : "text-white/50 hover:text-white/80"
                    )}
                >
                    {year}
                    {activeYear === year && (
                        <div className="absolute right-0 h-1 w-1 rounded-full bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
}
