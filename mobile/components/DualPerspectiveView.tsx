import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DualPerspectiveViewProps {
    perspectiveA: {
        author: string;
        content: string;
    };
    perspectiveB: {
        author: string;
        content: string;
    };
}

export default function DualPerspectiveView({
    perspectiveA,
    perspectiveB,
}: DualPerspectiveViewProps) {
    const scrollViewARef = React.useRef<ScrollView>(null);
    const scrollViewBRef = React.useRef<ScrollView>(null);
    const [isScrolling, setIsScrolling] = React.useState(false);

    const handleScroll = (event: any, scrollToOther: React.RefObject<ScrollView | null>) => {
        if (isScrolling) return;

        const offsetY = event.nativeEvent.contentOffset.y;
        setIsScrolling(true);

        scrollToOther.current?.scrollTo({
            y: offsetY,
            animated: false,
        });

        setTimeout(() => setIsScrolling(false), 50);
    };

    return (
        <View style={styles.container}>
            {/* Perspective A */}
            <View style={styles.perspective}>
                <View style={styles.perspectiveHeader}>
                    <Ionicons name="person" size={16} color="#007AFF" />
                    <Text style={styles.perspectiveLabel}>{perspectiveA.author}</Text>
                </View>
                <ScrollView
                    ref={scrollViewARef}
                    style={styles.scrollView}
                    onScroll={(e) => handleScroll(e, scrollViewBRef)}
                    scrollEventThrottle={16}
                >
                    <Text style={styles.content}>{perspectiveA.content}</Text>
                </ScrollView>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
                <Ionicons name="swap-horizontal" size={20} color="#666" />
            </View>

            {/* Perspective B */}
            <View style={styles.perspective}>
                <View style={styles.perspectiveHeader}>
                    <Ionicons name="person" size={16} color="#FF6B6B" />
                    <Text style={styles.perspectiveLabel}>{perspectiveB.author}</Text>
                </View>
                <ScrollView
                    ref={scrollViewBRef}
                    style={styles.scrollView}
                    onScroll={(e) => handleScroll(e, scrollViewARef)}
                    scrollEventThrottle={16}
                >
                    <Text style={styles.content}>{perspectiveB.content}</Text>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    perspective: {
        flex: 1,
    },
    perspectiveHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    perspectiveLabel: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    content: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 24,
    },
    divider: {
        width: 40,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
