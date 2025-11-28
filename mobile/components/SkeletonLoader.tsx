import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export const SkeletonLoader = () => {
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.skeleton, styles.avatar, animatedStyle]} />
            <View style={styles.contentSkeleton}>
                <Animated.View style={[styles.skeleton, styles.line, styles.lineLong, animatedStyle]} />
                <Animated.View style={[styles.skeleton, styles.line, styles.lineShort, animatedStyle]} />
                <Animated.View style={[styles.skeleton, styles.line, styles.lineMedium, animatedStyle]} />
            </View>
        </View>
    );
};

export const CardSkeleton = () => {
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.card}>
            <Animated.View style={[styles.skeleton, styles.cardImage, animatedStyle]} />
            <View style={styles.cardContent}>
                <Animated.View style={[styles.skeleton, styles.line, styles.lineLong, animatedStyle]} />
                <Animated.View style={[styles.skeleton, styles.line, styles.lineShort, animatedStyle]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    skeleton: {
        backgroundColor: '#E1E9EE',
        borderRadius: 8,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    contentSkeleton: {
        flex: 1,
    },
    line: {
        height: 12,
        marginBottom: 8,
    },
    lineLong: {
        width: '80%',
    },
    lineShort: {
        width: '40%',
    },
    lineMedium: {
        width: '60%',
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 200,
    },
    cardContent: {
        padding: 16,
    },
});
