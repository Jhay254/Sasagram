import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CliffhangerBadgeProps {
    score: number; // 0-100
    compact?: boolean;
}

export default function CliffhangerBadge({ score, compact = false }: CliffhangerBadgeProps) {
    // Only show badge if score is significant
    if (score < 60) {
        return null;
    }

    const getIntensityLevel = () => {
        if (score >= 80) return 'Intense';
        if (score >= 70) return 'Strong';
        return 'Mild';
    };

    const getColor = () => {
        if (score >= 80) return '#FF3B30';
        if (score >= 70) return '#FF9500';
        return '#FFCC00';
    };

    const color = getColor();
    const intensity = getIntensityLevel();

    if (compact) {
        return (
            <View style={[styles.compactBadge, { backgroundColor: color }]}>
                <Ionicons name="flash" size={14} color="#fff" />
            </View>
        );
    }

    return (
        <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
            <Ionicons name="flash" size={16} color={color} />
            <Text style={[styles.text, { color }]}>
                {intensity} Cliffhanger!
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    compactBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
