import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface PreviewCardProps {
    type: 'biography' | 'profile';
    title: string;
    description?: string;
    imageUrl?: string;
    author?: string;
    verified?: boolean;
    stats?: {
        views?: number;
        followers?: number;
    };
}

export default function PreviewCard({
    type,
    title,
    description,
    imageUrl,
    author,
    verified,
    stats,
}: PreviewCardProps) {
    const { theme } = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {/* Cover Image */}
            <View style={[styles.imageContainer, { backgroundColor: theme.colors.border }]}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                    <Ionicons
                        name={type === 'biography' ? 'book' : 'person'}
                        size={48}
                        color={theme.colors.textSecondary}
                    />
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                    {title}
                </Text>

                {description && (
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                        {description}
                    </Text>
                )}

                {/* Author / Stats */}
                <View style={styles.footer}>
                    {author && (
                        <View style={styles.authorRow}>
                            <Text style={[styles.author, { color: theme.colors.textSecondary }]}>
                                {author}
                            </Text>
                            {verified && (
                                <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                            )}
                        </View>
                    )}

                    {stats && (
                        <View style={styles.stats}>
                            {stats.views !== undefined && (
                                <View style={styles.statItem}>
                                    <Ionicons name="eye-outline" size={16} color={theme.colors.textSecondary} />
                                    <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                                        {stats.views.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                            {stats.followers !== undefined && (
                                <View style={styles.statItem}>
                                    <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                                    <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                                        {stats.followers.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Lifeline branding */}
                <View style={styles.branding}>
                    <Text style={[styles.brandText, { color: theme.colors.textSecondary }]}>
                        Lifeline
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 28,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        marginBottom: 8,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    author: {
        fontSize: 14,
        fontWeight: '600',
    },
    stats: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 13,
    },
    branding: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingTop: 12,
        marginTop: 12,
    },
    brandText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
