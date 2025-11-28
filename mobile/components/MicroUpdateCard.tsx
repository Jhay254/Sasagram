import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface MicroUpdateCardProps {
    update: {
        id: string;
        updateType: 'MICRO_UPDATE' | 'EDIT' | 'ADDITION' | 'CORRECTION';
        summary: string;
        content?: string;
        createdAt: string;
    };
    chapterTitle?: string;
    onPress?: () => void;
}

export default function MicroUpdateCard({ update, chapterTitle, onPress }: MicroUpdateCardProps) {
    const getIcon = () => {
        switch (update.updateType) {
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

    const getColor = () => {
        switch (update.updateType) {
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

    const getLabel = () => {
        switch (update.updateType) {
            case 'MICRO_UPDATE':
                return 'Update';
            case 'EDIT':
                return 'Edited';
            case 'ADDITION':
                return 'Added';
            case 'CORRECTION':
                return 'Corrected';
            default:
                return 'Update';
        }
    };

    const timeAgo = formatDistanceToNow(new Date(update.createdAt), { addSuffix: true });
    const color = getColor();

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Ionicons name={getIcon() as any} size={20} color={color} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: color }]}>
                        <Text style={styles.badgeText}>{getLabel()}</Text>
                    </View>
                    <Text style={styles.timeText}>{timeAgo}</Text>
                </View>

                <Text style={styles.summary}>{update.summary}</Text>

                {chapterTitle && (
                    <View style={styles.chapterInfo}>
                        <Ionicons name="book-outline" size={12} color="#999" />
                        <Text style={styles.chapterTitle} numberOfLines={1}>
                            {chapterTitle}
                        </Text>
                    </View>
                )}

                {update.content && (
                    <Text style={styles.details} numberOfLines={2}>
                        {update.content}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginVertical: 6,
        marginHorizontal: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    timeText: {
        fontSize: 11,
        color: '#999',
    },
    summary: {
        fontSize: 14,
        color: '#333',
        lineHeight: 18,
        marginBottom: 4,
    },
    chapterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    chapterTitle: {
        fontSize: 11,
        color: '#999',
        marginLeft: 4,
        flex: 1,
    },
    details: {
        fontSize: 12,
        color: '#888',
        lineHeight: 16,
        marginTop: 4,
        fontStyle: 'italic',
    },
});
