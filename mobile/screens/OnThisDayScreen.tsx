import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface OnThisDayMemory {
    yearsAgo: number;
    originalDate: Date;
    title: string;
    summary: string;
    snapshot: any;
}

export default function OnThisDayScreen({ navigation }: any) {
    const [memories, setMemories] = useState<OnThisDayMemory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOnThisDayMemories();
    }, []);

    const loadOnThisDayMemories = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }
            const response = await fetch('/api/rewind/on-this-day', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setMemories(data.memories);
        } catch (error) {
            console.error('Error loading On This Day memories:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (memories.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={80} color="#666" />
                <Text style={styles.emptyText}>No memories from this day</Text>
                <Text style={styles.emptySubtext}>
                    Check back as you build your digital biography!
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>On This Day</Text>
                <Text style={styles.headerSubtitle}>{format(new Date(), 'MMMM d')}</Text>
            </View>

            {memories.map((memory, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.memoryCard}
                    onPress={() => navigation.navigate('Rewind', { date: memory.originalDate })}
                >
                    <View style={styles.memoryHeader}>
                        <View style={styles.yearBadge}>
                            <Text style={styles.yearText}>{memory.yearsAgo}</Text>
                            <Text style={styles.yearLabel}>
                                year{memory.yearsAgo > 1 ? 's' : ''} ago
                            </Text>
                        </View>
                        <Text style={styles.memoryDate}>
                            {format(new Date(memory.originalDate), 'MMM d, yyyy')}
                        </Text>
                    </View>

                    <Text style={styles.memoryTitle}>{memory.title}</Text>
                    <Text style={styles.memorySummary}>{memory.summary}</Text>

                    {/* Preview thumbnails */}
                    {memory.snapshot?.photos?.length > 0 && (
                        <ScrollView horizontal style={styles.thumbnailScroll}>
                            {memory.snapshot.photos.slice(0, 3).map((photo: any, idx: number) => (
                                <Image
                                    key={idx}
                                    source={{ uri: photo.url }}
                                    style={styles.thumbnail}
                                />
                            ))}
                            {memory.snapshot.photos.length > 3 && (
                                <View style={[styles.thumbnail, styles.moreThumbnail]}>
                                    <Text style={styles.moreText}>
                                        +{memory.snapshot.photos.length - 3}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}

                    <View style={styles.memoryFooter}>
                        <Ionicons name="arrow-forward" size={20} color="#007AFF" />
                        <Text style={styles.viewText}>View this day</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 40,
    },
    emptyText: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '600',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    header: {
        padding: 20,
        backgroundColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 18,
        color: '#999',
        marginTop: 4,
    },
    memoryCard: {
        margin: 16,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    memoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    yearBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    yearText: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: 'bold',
    },
    yearLabel: {
        fontSize: 12,
        color: '#FFF',
    },
    memoryDate: {
        fontSize: 14,
        color: '#999',
    },
    memoryTitle: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 8,
    },
    memorySummary: {
        fontSize: 14,
        color: '#999',
        lineHeight: 20,
    },
    thumbnailScroll: {
        marginTop: 12,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
    },
    moreThumbnail: {
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    memoryFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    viewText: {
        fontSize: 14,
        color: '#007AFF',
        marginLeft: 8,
        fontWeight: '600',
    },
});
