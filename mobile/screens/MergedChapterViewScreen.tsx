import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MergedChapter {
    id: string;
    title: string;
    perspectiveAContent: string;
    perspectiveBContent: string;
    creatorA: { id: string; name: string; profilePictureUrl: string };
    creatorB: { id: string; name: string; profilePictureUrl: string };
    revenueSplitRatio: number;
    totalEarnings: number;
}

export default function MergedChapterViewScreen({ route, navigation }: any) {
    const { chapterId } = route.params;
    const [chapter, setChapter] = useState<MergedChapter | null>(null);
    const [loading, setLoading] = useState(true);

    // Refs for synchronized scrolling
    const scrollViewARef = useRef<ScrollView>(null);
    const scrollViewBRef = useRef<ScrollView>(null);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        loadChapter();
    }, [chapterId]);

    const loadChapter = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const response = await fetch(`/api/mergers/${chapterId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setChapter(data);
        } catch (error) {
            console.error('Error loading merged chapter:', error);
        } finally {
            setLoading(false);
        }
    };

    // Synchronized scrolling handler
    const handleScroll = (event: any, scrollToOther: any) => {
        if (isScrolling) return;

        const offsetY = event.nativeEvent.contentOffset.y;
        setIsScrolling(true);

        scrollToOther?.current?.scrollTo({
            y: offsetY,
            animated: false,
        });

        setTimeout(() => setIsScrolling(false), 50);
    };

    if (loading || !chapter) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading merged chapter...</Text>
            </View>
        );
    }

    const splitPercentage = Math.round(chapter.revenueSplitRatio * 100);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{chapter.title}</Text>
                <TouchableOpacity onPress={() => {/* Open menu */ }}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Collaborators Info */}
            <View style={styles.collaboratorsInfo}>
                <View style={styles.collaborator}>
                    <Text style={styles.collaboratorName}>{chapter.creatorA.name}</Text>
                    <Text style={styles.revenueShare}>{splitPercentage}% share</Text>
                </View>
                <Ionicons name="people" size={24} color="#666" />
                <View style={styles.collaborator}>
                    <Text style={styles.collaboratorName}>{chapter.creatorB.name}</Text>
                    <Text style={styles.revenueShare}>{100 - splitPercentage}% share</Text>
                </View>
            </View>

            {/* Dual-Column Synchronized View */}
            <View style={styles.dualColumnContainer}>
                {/* Perspective A */}
                <View style={styles.column}>
                    <View style={styles.columnHeader}>
                        <Text style={styles.columnTitle}>{chapter.creatorA.name}'s View</Text>
                    </View>
                    <ScrollView
                        ref={scrollViewARef}
                        style={styles.scrollView}
                        onScroll={(e) => handleScroll(e, scrollViewBRef)}
                        scrollEventThrottle={16}
                    >
                        <Text style={styles.perspectiveText}>{chapter.perspectiveAContent}</Text>
                    </ScrollView>
                </View>

                {/* Vertical Divider */}
                <View style={styles.divider} />

                {/* Perspective B */}
                <View style={styles.column}>
                    <View style={styles.columnHeader}>
                        <Text style={styles.columnTitle}>{chapter.creatorB.name}'s View</Text>
                    </View>
                    <ScrollView
                        ref={scrollViewBRef}
                        style={styles.scrollView}
                        onScroll={(e) => handleScroll(e, scrollViewARef)}
                        scrollEventThrottle={16}
                    >
                        <Text style={styles.perspectiveText}>{chapter.perspectiveBContent}</Text>
                    </ScrollView>
                </View>
            </View>

            {/* Bottom Stats */}
            <View style={styles.bottomStats}>
                <View style={styles.stat}>
                    <Ionicons name="eye" size={20} color="#999" />
                    <Text style={styles.statText}>{chapter.totalEarnings > 0 ? `$${chapter.totalEarnings.toFixed(2)}` : 'No earnings yet'}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#FFF',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        marginLeft: 16,
    },
    collaboratorsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#1a1a1a',
    },
    collaborator: {
        flex: 1,
    },
    collaboratorName: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    revenueShare: {
        color: '#007AFF',
        fontSize: 12,
        marginTop: 4,
    },
    dualColumnContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    column: {
        flex: 1,
    },
    columnHeader: {
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    columnTitle: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    perspectiveText: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 24,
    },
    divider: {
        width: 2,
        backgroundColor: '#333',
    },
    bottomStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        color: '#999',
        fontSize: 14,
        marginLeft: 8,
    },
});
