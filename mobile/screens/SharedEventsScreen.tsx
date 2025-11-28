import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

export default function SharedEventsScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { connectionId } = route.params;
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSharedEvents();
    }, []);

    const fetchSharedEvents = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch(`/api/memory-graph/connections/${connectionId}/events`);
            // const data = await response.json();
            // setEvents(data.data);

            // Mock data
            setEvents([
                {
                    id: '1',
                    eventType: 'SPATIAL_OVERLAP',
                    eventDate: new Date('2024-11-15T14:30:00'),
                    location: 'Central Park, NYC',
                    latitude: 40.785091,
                    longitude: -73.968285,
                    confidence: 0.95,
                    metadata: { distance: 45 },
                },
                {
                    id: '2',
                    eventType: 'TEMPORAL_OVERLAP',
                    eventDate: new Date('2024-11-10T19:00:00'),
                    location: 'Brooklyn',
                    confidence: 0.82,
                    metadata: {},
                },
            ]);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'SPATIAL_OVERLAP':
                return 'location';
            case 'TEMPORAL_OVERLAP':
                return 'time';
            case 'MUTUAL_MENTION':
                return 'at';
            default:
                return 'star';
        }
    };

    const getEventColor = (eventType: string) => {
        switch (eventType) {
            case 'SPATIAL_OVERLAP':
                return '#10b981';
            case 'TEMPORAL_OVERLAP':
                return '#3b82f6';
            case 'MUTUAL_MENTION':
                return '#8b5cf6';
            default:
                return theme.colors.primary;
        }
    };

    const renderEvent = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: getEventColor(item.eventType) + '20' }]}>
                <Ionicons name={getEventIcon(item.eventType)} size={24} color={getEventColor(item.eventType)} />
            </View>

            <View style={styles.eventInfo}>
                <Text style={[styles.eventDate, { color: theme.colors.text }]}>
                    {format(new Date(item.eventDate), 'MMMM d, yyyy')}
                </Text>
                <Text style={[styles.eventTime, { color: theme.colors.textSecondary }]}>
                    {format(new Date(item.eventDate), 'h:mm a')}
                </Text>
                {item.location && (
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
                            {item.location}
                        </Text>
                    </View>
                )}
                <View style={styles.confidenceContainer}>
                    <View style={[styles.confidenceBar, { backgroundColor: theme.colors.border }]}>
                        <View
                            style={[
                                styles.confidenceFill,
                                {
                                    backgroundColor: getEventColor(item.eventType),
                                    width: `${item.confidence * 100}%`,
                                },
                            ]}
                        />
                    </View>
                    <Text style={[styles.confidenceText, { color: theme.colors.textSecondary }]}>
                        {(item.confidence * 100).toFixed(0)}% match
                    </Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Shared Moments
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Loading moments...
                    </Text>
                </View>
            ) : events.length > 0 ? (
                <FlatList
                    data={events}
                    renderItem={renderEvent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No shared moments found
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        Keep adding memories to discover more connections
                    </Text>
                </View>
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
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    eventInfo: {
        flex: 1,
    },
    eventDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    eventTime: {
        fontSize: 14,
        marginBottom: 6,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    location: {
        fontSize: 13,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    confidenceBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    confidenceFill: {
        height: '100%',
        borderRadius: 2,
    },
    confidenceText: {
        fontSize: 11,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
