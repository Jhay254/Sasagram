import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ProgressBarProps {
    progress: number; // 0-100
    height?: number;
    showPercentage?: boolean;
}

export default function ProgressBar({
    progress,
    height = 8,
    showPercentage = true,
}: ProgressBarProps) {
    const { theme } = useTheme();
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.progressBar,
                    { backgroundColor: theme.colors.border, height },
                ]}
            >
                <View
                    style={[
                        styles.progressFill,
                        {
                            backgroundColor: theme.colors.primary,
                            width: `${clampedProgress}%`,
                            height,
                        },
                    ]}
                />
            </View>
            {showPercentage && (
                <Text style={[styles.percentage, { color: theme.colors.textSecondary }]}>
                    {clampedProgress.toFixed(0)}%
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        borderRadius: 4,
    },
    percentage: {
        fontSize: 14,
        fontWeight: '600',
        minWidth: 40,
    },
});
