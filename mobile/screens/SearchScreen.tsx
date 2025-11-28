import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'biographies', label: 'Biographies' },
    { id: 'creators', label: 'Creators' },
    { id: 'tags', label: 'Tags' },
];

export default function SearchScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [autocomplete, setAutocomplete] = useState<any>(null);
    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [trendingTags, setTrendingTags] = useState<any[]>([]);
    const searchTimeout = useRef<any>(null);

    useEffect(() => {
        fetchSearchHistory();
        fetchTrendingTags();
    }, []);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            // Debounce autocomplete
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => {
                fetchAutocomplete();
            }, 300);
        } else {
            setAutocomplete(null);
        }
    }, [searchQuery]);

    const fetchSearchHistory = async () => {
        try {
            // TODO: Call API
            // const response = await fetch('/api/search/history');
            setSearchHistory([
                { id: '1', query: 'startup journey', createdAt: new Date() },
                { id: '2', query: 'travel asia', createdAt: new Date() },
            ]);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchTrendingTags = async () => {
        try {
            // TODO: Call API
            // const response = await fetch('/api/search/tags/trending');
            setTrendingTags([
                { name: 'technology', count: 145 },
                { name: 'travel', count: 98 },
                { name: 'entrepreneurship', count: 76 },
            ]);
        } catch (error) {
            console.error('Error fetching trending:', error);
        }
    };

    const fetchAutocomplete = async () => {
        try {
            // TODO: Call API
            // const response = await fetch(`/api/search/autocomplete?q=${searchQuery}`);
            setAutocomplete({
                biographies: ['My Startup Journey', 'Travels Through Asia'],
                creators: ['Sarah Johnson', 'Mike Chen'],
                tags: ['technology', 'travel'],
            });
        } catch (error) {
            console.error('Error fetching autocomplete:', error);
        }
    };

    const handleSearch = async (query: string) => {
        if (!query) return;

        setSearchQuery(query);
        setSearching(true);
        setAutocomplete(null);

        try {
            // TODO: Call API based on filter
            // const response = await fetch(`/api/search/${selectedFilter}?q=${query}`);

            // Mock results
            setResults([
                {
                    id: '1',
                    type: 'biography',
                    title: 'My Startup Journey',
                    user: { firstName: 'Sarah', lastName: 'J.', isVerified: true },
                    viewCount: 8543,
                },
                {
                    id: '2',
                    type: 'creator',
                    firstName: 'Mike',
                    lastName: 'Chen',
                    displayName: '@mikec',
                    followerCount: 856,
                    isVerified: false,
                },
            ]);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleHistoryTap = (query: string) => {
        handleSearch(query);
    };

    const handleTagTap = (tag: string) => {
        handleSearch(tag);
    };

    const renderHistoryItem = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleHistoryTap(item.query)}
        >
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.historyText, { color: theme.colors.text }]}>
                {item.query}
            </Text>
            <TouchableOpacity style={styles.deleteButton}>
                <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderTrendingTag = (tag: any) => (
        <TouchableOpacity
            key={tag.name}
            style={[styles.tagChip, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleTagTap(tag.name)}
        >
            <Text style={[styles.tagText, { color: theme.colors.text }]}>
                #{tag.name}
            </Text>
            <Text style={[styles.tagCount, { color: theme.colors.textSecondary }]}>
                {tag.count}
            </Text>
        </TouchableOpacity>
    );

    const renderResult = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
                if (item.type === 'biography') {
                    navigation.navigate('BiographyViewer', { biographyId: item.id });
                } else if (item.type === 'creator') {
                    navigation.navigate('PublicProfile', { userId: item.id });
                }
            }}
        >
            <View style={[styles.resultIcon, { backgroundColor: theme.colors.border }]}>
                <Ionicons
                    name={item.type === 'biography' ? 'book' : 'person'}
                    size={24}
                    color={theme.colors.textSecondary}
                />
            </View>
            <View style={styles.resultInfo}>
                <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
                    {item.title || `${item.firstName} ${item.lastName}`}
                </Text>
                {item.type === 'biography' && (
                    <Text style={[styles.resultMeta, { color: theme.colors.textSecondary }]}>
                        {item.viewCount.toLocaleString()} views
                    </Text>
                )}
                {item.type === 'creator' && (
                    <Text style={[styles.resultMeta, { color: theme.colors.textSecondary }]}>
                        {item.followerCount.toLocaleString()} followers
                    </Text>
                )}
            </View>
            {item.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={[styles.searchBar, { backgroundColor: theme.colors.background }]}>
                    <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text }]}
                        placeholder="Search biographies, creators, tags..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={() => handleSearch(searchQuery)}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor:
                                    selectedFilter === filter.id
                                        ? theme.colors.primary
                                        : theme.colors.surface,
                            },
                        ]}
                        onPress={() => setSelectedFilter(filter.id)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                {
                                    color:
                                        selectedFilter === filter.id
                                            ? '#FFF'
                                            : theme.colors.text,
                                },
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Autocomplete */}
            {autocomplete && (
                <View style={[styles.autocomplete, { backgroundColor: theme.colors.surface }]}>
                    {autocomplete.biographies?.map((title: string) => (
                        <TouchableOpacity
                            key={title}
                            style={styles.autocompleteItem}
                            onPress={() => handleSearch(title)}
                        >
                            <Ionicons name="book-outline" size={18} color={theme.colors.textSecondary} />
                            <Text style={[styles.autocompleteText, { color: theme.colors.text }]}>
                                {title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {autocomplete.creators?.map((name: string) => (
                        <TouchableOpacity
                            key={name}
                            style={styles.autocompleteItem}
                            onPress={() => handleSearch(name)}
                        >
                            <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
                            <Text style={[styles.autocompleteText, { color: theme.colors.text }]}>
                                {name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Results or Empty State */}
            {searching ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : results.length > 0 ? (
                <FlatList
                    data={results}
                    renderItem={renderResult}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.resultsList}
                />
            ) : searchQuery ? (
                <View style={styles.emptyState}>
                    <Ionicons name="sad-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No results found
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.emptyContainer}>
                    {/* Search History */}
                    {searchHistory.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                    Recent Searches
                                </Text>
                                <TouchableOpacity>
                                    <Text style={[styles.clearButton, { color: theme.colors.primary }]}>
                                        Clear
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={searchHistory}
                                renderItem={renderHistoryItem}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {/* Trending Tags */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Trending Tags
                        </Text>
                        <View style={styles.tagsGrid}>
                            {trendingTags.map(renderTrendingTag)}
                        </View>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filtersContainer: {
        maxHeight: 50,
    },
    filtersContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginRight: 8,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    autocomplete: {
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 8,
        marginTop: 4,
    },
    autocompleteItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    autocompleteText: {
        fontSize: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultsList: {
        padding: 16,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    resultIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    resultMeta: {
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptyContainer: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    clearButton: {
        fontSize: 14,
        fontWeight: '600',
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        gap: 12,
    },
    historyText: {
        flex: 1,
        fontSize: 15,
    },
    deleteButton: {
        padding: 4,
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    tagText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tagCount: {
        fontSize: 12,
    },
});
