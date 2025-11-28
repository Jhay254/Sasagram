import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    source: string;
    isPublic: boolean;
    isRecruiting: boolean;
    isInvestor: boolean;
    imageUrl?: string;
}

export default function CompanyTimelineScreen({ navigation }: any) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string | null>(null);

    useEffect(() => {
        loadTimeline();
    }, [filter]);

    const loadTimeline = async () => {
        try {
            const params = filter ? { category: filter } : {};
            const response = await axios.get('/api/timeline', { params });
            setEvents(response.data);
        } catch (error) {
            console.error('Error loading timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            FOUNDING: 'rocket',
            FUNDING: 'cash',
            PRODUCT_LAUNCH: 'cube',
            HIRE: 'person-add',
            ACQUISITION: 'business',
            PARTNERSHIP: 'handshake',
        };
        return icons[category] || 'calendar';
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            FOUNDING: '#6366F1',
            FUNDING: '#10B981',
            PRODUCT_LAUNCH: '#F59E0B',
            HIRE: '#8B5CF6',
            ACQUISITION: '#EF4444',
            PARTNERSHIP: '#3B82F6',
        };
        return colors[category] || '#6B7280';
    };

    const renderEvent = ({ item }: { item: TimelineEvent }) => (
        <TouchableOpacity
            style={styles.eventCard}
            onPress={() => navigation.navigate('EditTimelineEvent', { eventId: item.id })}
        >
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Ionicons name={getCategoryIcon(item.category) as any} size={20} color="#FFFFFF" />
            </View>

            <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.eventMeta}>
                    <Text style={styles.eventDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </Text>

                    {item.source !== 'MANUAL' && (
                        <View style={styles.sourceBadge}>
                            <Ionicons name="sync" size={12} color="#6366F1" />
                            <Text style={styles.sourceText}>{item.source}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.visibilityRow}>
                    {item.isPublic && (
                        <View style={styles.visibilityBadge}>
                            <Ionicons name="globe-outline" size={14} color="#10B981" />
                            <Text style={styles.visibilityText}>Public</Text>
                        </View>
                    )}
                    {item.isRecruiting && (
                        <View style={styles.visibilityBadge}>
                            <Ionicons name="briefcase-outline" size={14} color="#8B5CF6" />
                            <Text style={styles.visibilityText}>Recruiting</Text>
                        </View>
                    )}
                    {item.isInvestor && (
                        <View style={styles.visibilityBadge}>
                            <Ionicons name="trending-up-outline" size={14} color="#F59E0B" />
                            <Text style={styles.visibilityText}>Investor</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Category Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
            >
                <TouchableOpacity
                    style={[styles.filterChip, !filter && styles.filterChipActive]}
                    onPress={() => setFilter(null)}
                >
                    <Text style={[styles.filterText, !filter && styles.filterTextActive]}>All</Text>
                </TouchableOpacity>

                {['FOUNDING', 'FUNDING', 'PRODUCT_LAUNCH', 'HIRE', 'ACQUISITION', 'PARTNERSHIP'].map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.filterChip, filter === cat && styles.filterChipActive]}
                        onPress={() => setFilter(cat)}
                    >
                        <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>
                            {cat.replace('_', ' ')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Timeline Events */}
            <FlatList
                data={events}
                renderItem={renderEvent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No timeline events yet</Text>
                    </View>
                }
            />

            {/* Add Event FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddTimelineEvent')}
            >
                <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 16,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    eventDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    eventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventDate: {
        fontSize: 13,
        color: '#9CA3AF',
        marginRight: 12,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    sourceText: {
        fontSize: 11,
        color: '#6366F1',
        marginLeft: 4,
        fontWeight: '500',
    },
    visibilityRow: {
        flexDirection: 'row',
        gap: 6,
    },
    visibilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    visibilityText: {
        fontSize: 11,
        color: '#6B7280',
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
