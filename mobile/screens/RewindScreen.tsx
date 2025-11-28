import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import MapView, { Marker } from 'react-native-maps';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DaySnapshot {
    date: string;
    dayOfWeek: string;
    location: any;
    posts: any[];
    events: any[];
    photos: any[];
    mood: any;
    hasContent: boolean;
}

export default function RewindScreen({ navigation }: any) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [snapshots, setSnapshots] = useState<DaySnapshot[]>([]);
    const [currentIndex, setCurrentIndex] = useState(7); // Middle of 15-day range
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    const translateX = useSharedValue(0);

    useEffect(() => {
        loadToken();
    }, []);

    useEffect(() => {
        if (token) {
            loadTimeline(currentDate);
        }
    }, [token]);

    const loadToken = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            setToken(storedToken);
        } catch (error) {
            console.error('Error loading token:', error);
        }
    };

    const loadTimeline = async (date: Date) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/rewind/timeline?date=${format(date, 'yyyy-MM-dd')}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            setSnapshots(data.snapshots);
        } catch (error) {
            console.error('Error loading timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const swipeGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
        })
        .onEnd((event) => {
            if (event.translationX > 100 && currentIndex > 0) {
                // Swipe right - previous day
                setCurrentIndex(currentIndex - 1);
                translateX.value = withSpring(0);
            } else if (event.translationX < -100 && currentIndex < snapshots.length - 1) {
                // Swipe left - next day
                setCurrentIndex(currentIndex + 1);
                translateX.value = withSpring(0);
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading your memories...</Text>
            </View>
        );
    }

    const snapshot = snapshots[currentIndex];

    if (!snapshot) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No memories found</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <GestureDetector gesture={swipeGesture}>
                <Animated.View style={[styles.container, animatedStyle]}>
                    <ScrollView style={styles.scrollView}>
                        {/* Date Header */}
                        <View style={styles.header}>
                            <Text style={styles.dateText}>{snapshot.dayOfWeek}</Text>
                            <Text style={styles.dateNumberText}>{format(new Date(snapshot.date), 'MMM d, yyyy')}</Text>
                            <Text style={styles.indicatorText}>
                                {currentIndex + 1} / {snapshots.length}
                            </Text>
                        </View>

                        {/* Location Map */}
                        {snapshot.location && (
                            <View style={styles.mapContainer}>
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: snapshot.location.latitude,
                                        longitude: snapshot.location.longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: snapshot.location.latitude,
                                            longitude: snapshot.location.longitude,
                                        }}
                                        title={snapshot.location.city}
                                    />
                                </MapView>
                                <Text style={styles.locationText}>
                                    📍 {snapshot.location.city}, {snapshot.location.country}
                                </Text>
                            </View>
                        )}

                        {/* Mood Indicator */}
                        {snapshot.mood && (
                            <View style={styles.moodContainer}>
                                <Text style={styles.sectionTitle}>Your Mood</Text>
                                <View style={styles.moodDisplay}>
                                    <Text style={styles.moodEmoji}>{getMoodEmoji(snapshot.mood.mood)}</Text>
                                    <Text style={styles.moodText}>{snapshot.mood.mood}</Text>
                                </View>
                            </View>
                        )}

                        {/* Photos Gallery */}
                        {snapshot.photos.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    📸 Photos ({snapshot.photos.length})
                                </Text>
                                <ScrollView horizontal style={styles.photoGallery}>
                                    {snapshot.photos.map((photo: any) => (
                                        <Image
                                            key={photo.id}
                                            source={{ uri: photo.url }}
                                            style={styles.photo}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Events */}
                        {snapshot.events.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    📅 Events ({snapshot.events.length})
                                </Text>
                                {snapshot.events.map((event: any) => (
                                    <View key={event.id} style={styles.eventCard}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        {event.description && (
                                            <Text style={styles.eventDescription}>{event.description}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Social Posts */}
                        {snapshot.posts.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    💬 Posts ({snapshot.posts.length})
                                </Text>
                                {snapshot.posts.map((post: any) => (
                                    <View key={post.id} style={styles.postCard}>
                                        <Text style={styles.postPlatform}>{post.platform}</Text>
                                        <Text style={styles.postContent}>{post.content}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {!snapshot.hasContent && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No activity on this day</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Navigation */}
                    <View style={styles.bottomNav}>
                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('OnThisDay')}
                        >
                            <Ionicons name="calendar" size={24} color="#007AFF" />
                            <Text style={styles.navText}>On This Day</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.navButton}
                            onPress={() => navigation.navigate('Comparison')}
                        >
                            <Ionicons name="git-compare" size={24} color="#007AFF" />
                            <Text style={styles.navText}>Compare</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

function getMoodEmoji(mood: string): string {
    const moodMap: Record<string, string> = {
        happy: '😊',
        sad: '😢',
        excited: '🎉',
        calm: '😌',
        anxious: '😰',
        grateful: '🙏',
    };
    return moodMap[mood] || '😐';
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
        marginTop: 16,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    dateText: {
        fontSize: 18,
        color: '#999',
        fontWeight: '500',
    },
    dateNumberText: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: 'bold',
        marginTop: 8,
    },
    indicatorText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    mapContainer: {
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    map: {
        height: 200,
        width: '100%',
    },
    locationText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        padding: 12,
        backgroundColor: '#1a1a1a',
    },
    moodContainer: {
        margin: 16,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    moodDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    moodEmoji: {
        fontSize: 40,
        marginRight: 12,
    },
    moodText: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '600',
    },
    section: {
        margin: 16,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 12,
    },
    photoGallery: {
        flexDirection: 'row',
    },
    photo: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginRight: 12,
    },
    eventCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    eventTitle: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    eventDescription: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    postCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    postPlatform: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 8,
    },
    postContent: {
        fontSize: 14,
        color: '#FFF',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 18,
        color: '#FFF',
        textAlign: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    navButton: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
    },
});
