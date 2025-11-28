import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface VerificationBadgeProps {
    count: number;
    size?: 'small' | 'medium' | 'large';
}

export default function VerificationBadge({ count, size = 'medium' }: VerificationBadgeProps) {
    const { theme } = useTheme();

    if (count === 0) return null;

    const sizeStyles = {
        small: { padding: 4, iconSize: 12, fontSize: 10 },
        medium: { padding: 6, iconSize: 14, fontSize: 12 },
        large: { padding: 8, iconSize: 16, fontSize: 14 },
    };

    const { padding, iconSize, fontSize } = sizeStyles[size];

    return (
        <View style={[styles.badge, { backgroundColor: theme.colors.primary, padding }]}>
            <Ionicons name="checkmark-circle" size={iconSize} color="#FFF" />
            <Text style={[styles.count, { fontSize, color: '#FFF' }]}>
                {count}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        gap: 4,
    },
    count: {
        fontWeight: 'bold',
    },
});
