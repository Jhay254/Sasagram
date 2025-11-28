import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface ScheduledChapterCardProps {
    chapter: {
        id: string;
        title: string;
        summary?: string;
        scheduledReleaseAt: string;
        order: number;
    };
    onPress?: () => void;
}

export default function ScheduledChapterCard({ chapter, onPress }: ScheduledChapterCardProps) {
    const releaseDate = new Date(chapter.scheduledReleaseAt);
    const now = new Date();
    const diff = releaseDate.getTime() - now.getTime();

    // Calculate countdown
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const countdownText =
        days > 0 ? `${days} day${days > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''}`;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            {/* Lock overlay */}
            <View style={styles.lockOverlay}>
                <View style={styles.lockCircle}>
                    <Ionicons name="lock-closed" size={24} color="#fff" />
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.episodeNumber}>Episode {chapter.order + 1}</Text>
                    <View style={styles.countdownBadge}>
                        <Ionicons name="time-outline" size={12} color="#fff" />
                        <Text style={styles.countdownText}>{countdownText}</Text>
                    </View>
                </View>

                <Text style={styles.title}>{chapter.title}</Text>

                {chapter.summary && (
                    <Text style={styles.summary} numberOfLines={2}>
                        {chapter.summary}
                    </Text>
                )}

                <View style={styles.footer}>
                    <Ionicons name="calendar-outline" size={14} color="#999" />
                    <Text style={styles.releaseDate}>
                        {format(releaseDate, 'MMM dd, h:mm a')}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 20,
        marginVertical: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
    },
    lockOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    lockCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    episodeNumber: {
        fontSize: 11,
        fontWeight: '600',
        color: '#007AFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF9500',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    countdownText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
        marginLeft: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 6,
    },
    summary: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    releaseDate: {
        fontSize: 12,
        color: '#999',
        marginLeft: 4,
    },
});
