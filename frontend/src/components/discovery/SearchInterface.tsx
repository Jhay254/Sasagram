'use client';

import { useState } from 'react';
import { SearchSuggestion } from '@/lib/types/discovery.types';
import { Input } from '@/components/ui/input';
import { Search, Clock, TrendingUp } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SearchInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
}

const recentSearches: SearchSuggestion[] = [
    { id: '1', text: 'entrepreneurs in new york', type: 'topic' },
    { id: '2', text: 'career changers', type: 'topic' },
];

const popularSearches: SearchSuggestion[] = [
    { id: '3', text: 'the risk taker', type: 'archetype' },
    { id: '4', text: 'relationships and family', type: 'topic' },
    { id: '5', text: 'startup founders', type: 'topic' },
];

export function SearchInterface({ isOpen, onClose, onSearch }: SearchInterfaceProps) {
    const [query, setQuery] = useState('');

    const handleSearch = (searchText: string) => {
        onSearch(searchText);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            handleSearch(query);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Search Creators</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search creators, topics, or life stages..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10"
                            autoFocus
                        />
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                Recent Searches
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((search) => (
                                    <button
                                        key={search.id}
                                        type="button"
                                        onClick={() => handleSearch(search.text)}
                                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                                    >
                                        {search.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Popular Searches */}
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Popular Searches
                        </div>
                        <div className="space-y-1">
                            {popularSearches.map((search) => (
                                <button
                                    key={search.id}
                                    type="button"
                                    onClick={() => handleSearch(search.text)}
                                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                                >
                                    {search.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
