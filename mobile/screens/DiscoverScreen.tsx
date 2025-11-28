import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'technology', name: 'Technology', icon: 'hardware-chip' },
    { id: 'arts', name: 'Arts', icon: 'color-palette' },
    { id: 'travel', name: 'Travel', icon: 'airplane' },
    { id: 'business', name: 'Business', icon: 'briefcase' },
    { id: 'sports', name: 'Sports', icon: 'football' },
];

export default function DiscoverScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [trending, setTrending] = useState<any[]>([]);
    const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);
    const [feed, setFeed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDiscoveryData();
    }, [selectedCategory]);

    const fetchDiscoveryData = async () => {
        try {
            setLoading(true);
            // TODO: Call APIs
            // const trendingRes = await fetch('/api/discovery/trending');
            // const creatorsRes = await fetch('/api/discovery/featured-creators');
            // const feedRes = await fetch('/api/discovery/feed');

            // Mock data
            setTrending([
                {
                    id: '1',
                    title: 'My Startup Journey',
                    user: { firstName: 'Sarah', lastName: 'J.', isVerified: true },
                    coverImageUrl: null,
                    viewCount: 8543,
                },
                {
                    id: '2',
                    title: 'Travels Through Asia',
                    user: { firstName: 'Mike', lastName: 'C.', isVerified: false },
                    coverImageUrl: null,
                    viewCount: 6721,
                },
            ]);

            setFeaturedCreators([
                {
                    id: '1',
                    firstName: 'Emma',
                    lastName: 'Davis',
                    avatarUrl: null,
                    isVerified: true,
                    followerCount: 12453,
                    bio: 'Writer & artist',
                },
            ]);

            setFeed([
                {
                    id: '3',
                    title: 'College Years',
                    user: { firstName: 'Alex', lastName: 'M.', isVerified: false },
                    coverImageUrl: null,
                    viewCount: 1245,
                },
            ]);
        } catch (error) {
            console.error('Error fetching discovery data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDiscoveryData();
    };

    const renderBiographyCard = (item: any, size: 'large' | 'medium' = 'medium') => (
        <TouchableOpacity
            key={item.id}
            style={[
                styles.bioCard,
                size === 'large' ? styles.bioCardLarge : styles.bioCardMedium,
                { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => navigation.navigate('BiographyViewer', { biographyId: item.id })}
        >
            <View
                style={[
                    styles.bioCover,
                    size === 'large' ? styles.bioCoverLarge : styles.bioCoverMedium,
                    { backgroundColor: theme.colors.border },
                ]}
            >
                {item.coverImageUrl ? (
                    <Image source={{ uri: item.coverImageUrl }} style={styles.coverImage} />
                ) : (
                    <Ionicons name="book" size={size === 'large' ? 48 : 32} color={theme.colors.textSecondary} />
                )}
            </View>
            <Text style={[styles.bioTitle, { color: theme.colors.text }]} numberOfLines={2}>
                {item.title}
            </Text>
            <View style={styles.bioMeta}>
                <Text style={[styles.bioAuthor, { color: theme.colors.textSecondary }]}>
                    {item.user.firstName} {item.user.lastName}
                </Text>
                {item.user.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />
                )}
            </View>
            <Text style={[styles.bioViews, { color: theme.colors.textSecondary }]}>
                {item.viewCount.toLocaleString()} views
            </Text>
        </TouchableOpacity>
    );

    const renderCreatorCard = (item: any) => (
        <TouchableOpacity
            key={item.id}
            style={[styles.creatorCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
        >
            <View style={[styles.creatorAvatar, { backgroundColor: theme.colors.border }]}>
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <Ionicons name="person" size={32} color={theme.colors.textSecondary} />
                )}
            </View>
            <View style={styles.creatorInfo}>
                <View style={styles.creatorNameRow}>
                    <Text style={[styles.creatorName, { color: theme.colors.text }]} numberOfLines={1}>
                        {item.firstName} {item.lastName}
                    </Text>
                    {item.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                    )}
                </View>
                <Text style={[styles.creatorBio, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {item.bio}
                </Text>
                <Text style={[styles.creatorFollowers, { color: theme.colors.textSecondary }]}>
                    {item.followerCount.toLocaleString()} followers
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Discover</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                    <Ionicons name="search" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesContainer}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {CATEGORIES.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor:
                                        selectedCategory === category.id
                                            ? theme.colors.primary
                                            : theme.colors.surface,
                                },
                            ]}
                            onPress={() => setSelectedCategory(category.id)}
                        >
                            <Ionicons
                                name={category.icon as any}
                                size={18}
                                color={
                                    selectedCategory === category.id
                                        ? '#FFF'
                                        : theme.colors.text
                                }
                            />
                            <Text
                                style={[
                                    styles.categoryText,
                                    {
                                        color:
                                            selectedCategory === category.id
                                                ? '#FFF'
                                                : theme.colors.text,
                                    },
                                ]}
                            >
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
                ) : (
                    <>
                        {/* Trending Section */}
                        {trending.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
                                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                        Trending Now
                                    </Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {trending.map((item) => renderBiographyCard(item, 'large'))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Featured Creators */}
                        {featuredCreators.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="star" size={24} color={theme.colors.primary} />
                                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                        Featured Creators
                                    </Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {featuredCreators.map((item) => renderCreatorCard(item))}
                                </ScrollView>
                            </View>
                        )}

                        {/* For You Feed */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="heart" size={24} color={theme.colors.primary} />
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                    Recommended for You
                                </Text>
                            </View>
                            <View style={styles.feedGrid}>
                                {feed.map((item) => renderBiographyCard(item))}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
    },
    categoriesContainer: {
        maxHeight: 60,
        marginBottom: 8,
    },
    categoriesContent: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        gap: 6,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loader: {
        marginTop: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    bioCard: {
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 12,
    },
    bioCardLarge: {
        width: 200,
    },
    bioCardMedium: {
        width: 160,
    },
    bioCover: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    bioCoverLarge: {
        width: 176,
        height: 120,
    },
    bioCoverMedium: {
        width: 136,
        height: 100,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    bioTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bioMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    bioAuthor: {
        fontSize: 14,
    },
    bioViews: {
        fontSize: 12,
    },
    creatorCard: {
        width: 200,
        marginRight: 16,
        padding: 16,
        borderRadius: 12,
    },
    creatorAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    creatorName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    creatorBio: {
        fontSize: 13,
        marginBottom: 8,
        lineHeight: 18,
    },
    creatorFollowers: {
        fontSize: 12,
    },
    feedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 12,
    },
});
