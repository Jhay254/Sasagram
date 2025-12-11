'use client';

import { useState } from 'react';
import { FilterTab, Category } from '@/lib/types/discovery.types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterTabsProps {
    activeTab: FilterTab;
    activeCategory?: Category;
    onTabChange: (tab: FilterTab) => void;
    onCategoryChange: (category: Category) => void;
}

const categories: { value: Category; label: string; icon: string }[] = [
    { value: 'career-business', label: 'Career & Business', icon: '💼' },
    { value: 'creative-arts', label: 'Creative & Arts', icon: '🎨' },
    { value: 'health-fitness', label: 'Health & Fitness', icon: '🏃' },
    { value: 'travel-adventure', label: 'Travel & Adventure', icon: '🌍' },
    { value: 'personal-growth', label: 'Personal Growth', icon: '📚' },
    { value: 'relationships-family', label: 'Relationships & Family', icon: '💑' },
    { value: 'education-learning', label: 'Education & Learning', icon: '🎓' },
    { value: 'gaming-entertainment', label: 'Gaming & Entertainment', icon: '🎮' },
    { value: 'technology-innovation', label: 'Technology & Innovation', icon: '🔧' },
    { value: 'politics-government', label: 'Politics & Government', icon: '🏛️' },
    { value: 'lifestyle-culture', label: 'Lifestyle & Culture', icon: '🏠' },
];

export function FilterTabs({
    activeTab,
    activeCategory,
    onTabChange,
    onCategoryChange,
}: FilterTabsProps) {
    const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(activeCategory);

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        onCategoryChange(category);
        onTabChange('category');
    };

    const getCategoryLabel = () => {
        if (!selectedCategory) return 'Categories';
        const category = categories.find((c) => c.value === selectedCategory);
        return category ? `${category.icon} ${category.label}` : 'Categories';
    };

    return (
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
                    <div className="flex h-10 items-center rounded-md bg-muted p-1 text-muted-foreground">
                        {[
                            { id: 'for-you', label: 'For You', icon: Flame },
                            { id: 'trending', label: 'Trending', icon: TrendingUp },
                            { id: 'new', label: 'New', icon: Sparkles },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id as FilterTab)}
                                    className={`relative flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive ? 'text-foreground' : 'hover:text-foreground'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-background shadow-sm rounded-sm"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                        <Icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex-shrink-0 ml-auto pl-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={activeTab === 'category' ? 'default' : 'outline'}
                                    className="gap-2 whitespace-nowrap"
                                >
                                    {getCategoryLabel()}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {categories.map((category) => (
                                    <DropdownMenuItem
                                        key={category.value}
                                        onClick={() => handleCategorySelect(category.value)}
                                        className="cursor-pointer"
                                    >
                                        <span className="mr-2">{category.icon}</span>
                                        {category.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
