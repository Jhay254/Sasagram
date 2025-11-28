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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface UpcomingChapter {
    id: string;
    title: string;
    summary?: string;
    scheduledReleaseAt: string;
    coverImageUrl?: string;
    order: number;
}

type ReleasePattern = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';

interface Schedule {
    releasePattern: ReleasePattern;
    dayOfWeek: number | null;
    timeOfDay?: string;
    nextReleaseAt?: string;
}

type RouteParams = {
    ChapterScheduleScreen: {
        biographyId: string;
        biographyTitle?: string;
    };
};

export default function ChapterScheduleScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams, 'ChapterScheduleScreen'>>();
    const { biographyId, biographyTitle } = route.params;

    const [upcomingChapters, setUpcomingChapters] = useState<UpcomingChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [schedule, setSchedule] = useState<Schedule | null>(null);

    useEffect(() => {
        fetchData();
    }, [biographyId]);

    const fetchData = async () => {
        try {
            // Fetch upcoming chapters
            const chaptersResponse = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/biographies/${biographyId}/upcoming`,
                {
                    headers: {
                        // Add auth token here
                    },
                }
            );
            const chaptersData = await chaptersResponse.json();
            setUpcomingChapters(chaptersData.chapters || []);

            // Fetch schedule info
            const scheduleResponse = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/biographies/${biographyId}/schedule`,
                {
                    headers: {
                        // Add auth token here
                    },
                }
            );

            if (scheduleResponse.ok) {
                const scheduleData = await scheduleResponse.json();
                setSchedule(scheduleData);
            }
        } catch (error) {
            console.error('Error fetching schedule data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const calculateTimeUntilRelease = (releaseDate: string) => {
        const now = new Date();
        const release = new Date(releaseDate);
        const diff = release.getTime() - now.getTime();

        if (diff < 0) return 'Available now';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const renderChapterCard = ({ item }: { item: UpcomingChapter }) => {
        const timeUntil = calculateTimeUntilRelease(item.scheduledReleaseAt);
        const releaseDate = new Date(item.scheduledReleaseAt);

        return (
            <TouchableOpacity style={styles.chapterCard} disabled>
                <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={32} color="#fff" />
                </View>

                <View style={styles.chapterInfo}>
                    <View style={styles.chapterHeader}>
                        <Text style={styles.chapterNumber}>Chapter {item.order + 1}</Text>
                        <View style={styles.countdownBadge}>
                            <Ionicons name="time-outline" size={14} color="#fff" />
                            <Text style={styles.countdownText}>{timeUntil}</Text>
                        </View>
                    </View>

                    <Text style={styles.chapterTitle}>{item.title}</Text>

                    {item.summary && (
                        <Text style={styles.chapterSummary} numberOfLines={2}>
                            {item.summary}
                        </Text>
                    )}

                    <View style={styles.releaseInfo}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.releaseDate}>
                            Releases on {format(releaseDate, 'MMM dd, yyyy \'at\' h:mm a')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderScheduleInfo = () => {
        if (!schedule) return null;

        const patternText: Record<ReleasePattern, string> = {
            WEEKLY: 'Weekly',
            BIWEEKLY: 'Bi-weekly',
            MONTHLY: 'Monthly',
            CUSTOM: 'Custom schedule',
        };
        const displayText = patternText[schedule.releasePattern] || 'Custom';

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayText = schedule.dayOfWeek !== null ? dayNames[schedule.dayOfWeek] : '';

        return (
            <View style={styles.scheduleInfoCard}>
                <Text style={styles.scheduleTitle}>Release Schedule</Text>
                <View style={styles.scheduleRow}>
                    <Ionicons name="sync-outline" size={20} color="#007AFF" />
                    <Text style={styles.scheduleText}>
                        {displayText} {dayText && `on ${dayText}s`}
                        {schedule.timeOfDay && ` at ${schedule.timeOfDay}`}
                    </Text>
                </View>

                {schedule.nextReleaseAt && (
                    <View style={styles.nextReleaseRow}>
                        <Ionicons name="arrow-forward-circle-outline" size={20} color="#34C759" />
                        <Text style={styles.nextReleaseText}>
                            Next: {format(new Date(schedule.nextReleaseAt), 'MMM dd, yyyy \'at\' h:mm a')}
                        </Text>
                    </View>
                )}
            </View>
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
                data={upcomingChapters}
                renderItem={renderChapterCard}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Upcoming Episodes</Text>
                            <Text style={styles.headerSubtitle}>{biographyTitle}</Text>
                        </View>
                        {renderScheduleInfo()}
                        {upcomingChapters.length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>No upcoming episodes scheduled</Text>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={null}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    scheduleInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#000',
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    scheduleText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    nextReleaseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    nextReleaseText: {
        fontSize: 14,
        color: '#34C759',
        fontWeight: '500',
        marginLeft: 8,
    },
    listContent: {
        paddingBottom: 20,
    },
    chapterCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lockedOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chapterInfo: {
        padding: 16,
    },
    chapterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    chapterNumber: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9500',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countdownText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 4,
    },
    chapterTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    chapterSummary: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    releaseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    releaseDate: {
        fontSize: 13,
        color: '#666',
        marginLeft: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
});
