import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ReactionPickerProps {
    chapterId: string;
    userReaction?: string;
    reactionCounts?: Record<string, number>;
    onReact: (reactionType: string) => void;
}

const REACTIONS = [
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'insightful', emoji: '💡', label: 'Insightful' },
    { type: 'inspiring', emoji: '⭐', label: 'Inspiring' },
];

export default function ReactionPicker({
    chapterId,
    userReaction,
    reactionCounts = {},
    onReact,
}: ReactionPickerProps) {
    const { theme } = useTheme();
    const [showPicker, setShowPicker] = useState(false);

    const handleReaction = (type: string) => {
        onReact(type);
        setShowPicker(false);
    };

    const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

    return (
        <View style={styles.container}>
            {/* Reaction Button */}
            <TouchableOpacity
                style={[
                    styles.reactionButton,
                    { backgroundColor: userReaction ? theme.colors.primary + '20' : theme.colors.surface },
                ]}
                onPress={() => setShowPicker(!showPicker)}
            >
                <Text style={styles.reactionEmoji}>
                    {userReaction ? REACTIONS.find(r => r.type === userReaction)?.emoji : '👍'}
                </Text>
                {totalReactions > 0 && (
                    <Text style={[styles.reactionCount, { color: theme.colors.text }]}>
                        {totalReactions}
                    </Text>
                )}
            </TouchableOpacity>

            {/* Reaction Picker */}
            {showPicker && (
                <View style={[styles.picker, { backgroundColor: theme.colors.surface }]}>
                    {REACTIONS.map((reaction) => (
                        <TouchableOpacity
                            key={reaction.type}
                            style={[
                                styles.reactionOption,
                                {
                                    backgroundColor:
                                        userReaction === reaction.type
                                            ? theme.colors.primary + '20'
                                            : 'transparent',
                                },
                            ]}
                            onPress={() => handleReaction(reaction.type)}
                        >
                            <Text style={styles.reactionOptionEmoji}>{reaction.emoji}</Text>
                            {reactionCounts[reaction.type] && (
                                <Text style={[styles.reactionOptionCount, { color: theme.colors.textSecondary }]}>
                                    {reactionCounts[reaction.type]}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    reactionEmoji: {
        fontSize: 20,
    },
    reactionCount: {
        fontSize: 14,
        fontWeight: '600',
    },
    picker: {
        position: 'absolute',
        bottom: 48,
        left: 0,
        flexDirection: 'row',
        padding: 8,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        gap: 4,
    },
    reactionOption: {
        padding: 8,
        borderRadius: 16,
        alignItems: 'center',
    },
    reactionOptionEmoji: {
        fontSize: 24,
    },
    reactionOptionCount: {
        fontSize: 10,
        marginTop: 2,
    },
});
