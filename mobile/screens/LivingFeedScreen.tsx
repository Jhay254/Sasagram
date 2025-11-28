import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface ChapterUpdate {
    id: string;
    updateType: 'MICRO_UPDATE' | 'EDIT' | 'ADDITION' | 'CORRECTION';
    summary: string;
    content?: string;
    createdAt: string;
    chapter: {
        id: string;
        title: string;
        biographyId: string;
        biography: {
            title: string;
            user: {
                displayName?: string;
                avatarUrl?: string;
            };
        };
    };
}

export default function LivingFeedScreen() {
    const navigation = useNavigation();
    const [updates, setUpdates] = useState<ChapterUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchFeed();
    }, []);

    const fetchFeed = async () => {
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/feed/following`,
                {
                    headers: {
                        // Add auth token here
                    },
                }
            );
            const data = await response.json();
            setUpdates(data.updates || []);
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchFeed();
    };

    const getUpdateIcon = (type: string) => {
        switch (type) {
            case 'MICRO_UPDATE':
                return 'add-circle';
            case 'EDIT':
                return 'create';
            case 'ADDITION':
                return 'document-text';
            case 'CORRECTION':
                return 'checkmark-circle';
            default:
                return 'ellipse';
        }
    };

    const getUpdateColor = (type: string) => {
        switch (type) {
            case 'MICRO_UPDATE':
                return '#007AFF';
            case 'EDIT':
                return '#FF9500';
            case 'ADDITION':
                return '#34C759';
            case 'CORRECTION':
                return '#FF3B30';
            default:
                return '#8E8E93';
        }
    };

    const renderUpdateCard = ({ item }: { item: ChapterUpdate }) => {
        const creatorName = item.chapter.biography.user.displayName || 'Unknown';
        const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
        const iconName = getUpdateIcon(item.updateType);
        const iconColor = getUpdateColor(item.updateType);

        return (
            <TouchableOpacity
                style={styles.updateCard}
                onPress={() => {
                    // Navigate to chapter
                    (navigation as any).navigate('ChapterDetail', {
                        chapterId: item.chapter.id,
                        biographyId: item.chapter.biographyId,
                    });
                }}
            >
                <View style={[styles.updateIcon, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={iconName as any} size={24} color={iconColor} />
                </View>

                <View style={styles.updateContent}>
                    <View style={styles.updateHeader}>
                        <Text style={styles.creatorName}>{creatorName}</Text>
                        <Text style={styles.timeAgo}>{timeAgo}</Text>
                    </View>

                    <Text style={styles.updateSummary}>{item.summary}</Text>

                    <View style={styles.chapterInfo}>
                        <Ionicons name="book-outline" size={14} color="#666" />
                        <Text style={styles.chapterTitle} numberOfLines={1}>
                            {item.chapter.title}
                        </Text>
                    </View>

                    {item.content && (
                        <Text style={styles.updateDetails} numberOfLines={2}>
                            {item.content}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={updates}
                renderItem={renderUpdateCard}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Living Feed</Text>
                        <Text style={styles.headerSubtitle}>
                            Updates from creators you follow
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="newspaper-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No updates yet</Text>
                        <Text style={styles.emptySubtext}>
                            Follow creators to see their chapter updates here
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    listContent: {
        paddingBottom: 20,
    },
    updateCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    updateIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    updateContent: {
        flex: 1,
    },
    updateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    creatorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    timeAgo: {
        fontSize: 12,
        color: '#999',
    },
    updateSummary: {
        fontSize: 15,
        color: '#333',
        lineHeight: 20,
        marginBottom: 8,
    },
    chapterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    chapterTitle: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
        flex: 1,
    },
    updateDetails: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
        marginTop: 4,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
