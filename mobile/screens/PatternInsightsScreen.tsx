import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Pattern {
    id: string;
    type: string;
    title: string;
    description: string;
    frequency: number;
    lastOccurrence: string;
    confidence: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export default function PatternInsightsScreen({ navigation }: any) {
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

    useEffect(() => {
        loadPatterns();
    }, []);

    const loadPatterns = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const response = await fetch('/api/patterns', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setPatterns(data.patterns);
        } catch (error) {
            console.error('Error loading patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPatternIcon = (type: string) => {
        const icons: Record<string, string> = {
            CAREER: 'briefcase',
            RELATIONSHIP: 'heart',
            PRODUCTIVITY: 'trending-up',
            SOCIAL: 'people',
            HEALTH: 'fitness',
        };
        return icons[type] || 'analytics';
    };

    const getPatternColor = (type: string) => {
        const colors: Record<string, string> = {
            CAREER: '#2196F3',
            RELATIONSHIP: '#E91E63',
            PRODUCTIVITY: '#4CAF50',
            SOCIAL: '#FF9800',
            HEALTH: '#9C27B0',
        };
        return colors[type] || '#666';
    };

    const getTrendIcon = (trend: string) => {
        return trend === 'INCREASING' ? 'trending-up' : trend === 'DECREASING' ? 'trending-down' : 'remove';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Analyzing your patterns...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pattern Insights</Text>
                <TouchableOpacity onPress={() => navigation.navigate('PatternPrivacy')}>
                    <Ionicons name="settings" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.premiumBanner}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
                <Text style={styles.premiumText}>AI-Powered Analysis (Premium)</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {patterns.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={64} color="#666" />
                        <Text style={styles.emptyText}>No patterns detected yet</Text>
                        <Text style={styles.emptySubtext}>
                            Keep journaling and we'll start identifying recurring themes
                        </Text>
                    </View>
                ) : (
                    patterns.map((pattern) => (
                        <TouchableOpacity
                            key={pattern.id}
                            style={styles.patternCard}
                            onPress={() => setSelectedPattern(pattern)}
                        >
                            <View style={styles.patternHeader}>
                                <View style={[styles.patternIcon, { backgroundColor: getPatternColor(pattern.type) + '20' }]}>
                                    <Ionicons name={getPatternIcon(pattern.type) as any} size={24} color={getPatternColor(pattern.type)} />
                                </View>
                                <View style={styles.patternInfo}>
                                    <Text style={styles.patternTitle}>{pattern.title}</Text>
                                    <Text style={styles.patternType}>{pattern.type}</Text>
                                </View>
                                <View style={styles.trendBadge}>
                                    <Ionicons name={getTrendIcon(pattern.trend) as any} size={16} color="#007AFF" />
                                </View>
                            </View>

                            <Text style={styles.patternDescription}>{pattern.description}</Text>

                            <View style={styles.patternStats}>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Frequency</Text>
                                    <Text style={styles.statValue}>{pattern.frequency}x</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Confidence</Text>
                                    <Text style={styles.statValue}>{Math.round(pattern.confidence * 100)}%</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Last Seen</Text>
                                    <Text style={styles.statValue}>
                                        {new Date(pattern.lastOccurrence).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <TouchableOpacity
                    style={styles.lifeCoachButton}
                    onPress={() => navigation.navigate('LifeCoach')}
                >
                    <Ionicons name="chatbubbles" size={20} color="#FFF" />
                    <Text style={styles.lifeCoachButtonText}>Ask Life Coach About Patterns</Text>
                </TouchableOpacity>
            </ScrollView>
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
        marginTop: 16,
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    premiumBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    premiumText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
    },
    patternCard: {
        backgroundColor: '#1a1a1a',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    patternHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    patternIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    patternInfo: {
        flex: 1,
        marginLeft: 12,
    },
    patternTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    patternType: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    trendBadge: {
        backgroundColor: '#007AFF20',
        padding: 8,
        borderRadius: 8,
    },
    patternDescription: {
        color: '#999',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    patternStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    stat: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
    },
    statValue: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    lifeCoachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    lifeCoachButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
