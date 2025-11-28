import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsDashboardScreen() {
    const { theme } = useTheme();
    const [snapshot, setSnapshot] = useState<any>(null);
    const [growth, setGrowth] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            // TODO: Call APIs
            // const snapshotRes = await fetch('/api/analytics/snapshot');
            // const growthRes = await fetch('/api/analytics/growth');
            // const performanceRes = await fetch('/api/analytics/performance');

            // Mock data
            setSnapshot({
                followers: 1234,
                biographies: 5,
                totalViews: 8543,
                totalLikes: 432,
                averageRating: 4.7,
            });

            setGrowth(
                Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    followers: Math.floor(Math.random() * 20) + 5,
                }))
            );

            setPerformance([
                { id: '1', title: 'My Startup Journey', viewCount: 3421, engagementRate: 12.5 },
                { id: '2', title: 'College Years', viewCount: 2156, engagementRate: 8.3 },
                { id: '3', title: 'Early Childhood', viewCount: 1876, engagementRate: 15.2 },
            ]);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    const StatCard = ({ icon, label, value, color }: any) => (
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {label}
            </Text>
        </View>
    );

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
        labelColor: (opacity = 1) => theme.colors.textSecondary,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.primary,
        },
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Analytics</Text>
                <Ionicons name="bar-chart" size={24} color="#FFF" />
            </LinearGradient>

            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Stats Overview */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Overview
                    </Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="people"
                            label="Followers"
                            value={snapshot?.followers}
                            color="#3b82f6"
                        />
                        <StatCard
                            icon="book"
                            label="Biographies"
                            value={snapshot?.biographies}
                            color="#667eea"
                        />
                        <StatCard
                            icon="eye"
                            label="Total Views"
                            value={snapshot?.totalViews}
                            color="#10b981"
                        />
                        <StatCard
                            icon="heart"
                            label="Total Likes"
                            value={snapshot?.totalLikes}
                            color="#ec4899"
                        />
                        <StatCard
                            icon="star"
                            label="Avg Rating"
                            value={snapshot?.averageRating?.toFixed(1)}
                            color="#f59e0b"
                        />
                        <StatCard
                            icon="trophy"
                            label="Engagement"
                            value="12.5%"
                            color="#8b5cf6"
                        />
                    </View>
                </View>

                {/* Growth Chart */}
                {growth.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Follower Growth (30 Days)
                        </Text>
                        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
                            <LineChart
                                data={{
                                    labels: growth
                                        .filter((_, i) => i % 6 === 0)
                                        .map(d => new Date(d.date).getDate().toString()),
                                    datasets: [
                                        {
                                            data: growth.map(d => d.followers),
                                        },
                                    ],
                                }}
                                width={screenWidth - 48}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    </View>
                )}

                {/* Top Content */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Top Performing Content
                    </Text>
                    {performance.map((item, index) => (
                        <View
                            key={item.id}
                            style={[styles.performanceItem, { backgroundColor: theme.colors.surface }]}
                        >
                            <View style={[styles.rank, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Text style={[styles.rankText, { color: theme.colors.primary }]}>
                                    #{index + 1}
                                </Text>
                            </View>
                            <View style={styles.performanceContent}>
                                <Text style={[styles.performanceTitle, { color: theme.colors.text }]}>
                                    {item.title}
                                </Text>
                                <View style={styles.performanceStats}>
                                    <View style={styles.performanceStat}>
                                        <Ionicons name="eye" size={16} color={theme.colors.textSecondary} />
                                        <Text style={[styles.performanceStatText, { color: theme.colors.textSecondary }]}>
                                            {item.viewCount.toLocaleString()} views
                                        </Text>
                                    </View>
                                    <View style={styles.performanceStat}>
                                        <Ionicons name="trending-up" size={16} color={theme.colors.textSecondary} />
                                        <Text style={[styles.performanceStatText, { color: theme.colors.textSecondary }]}>
                                            {item.engagementRate}% engagement
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    section: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: (screenWidth - 60) / 2,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
    },
    chartContainer: {
        borderRadius: 16,
        padding: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    performanceItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    rank: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    performanceContent: {
        flex: 1,
    },
    performanceTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    performanceStats: {
        flexDirection: 'row',
        gap: 16,
    },
    performanceStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    performanceStatText: {
        fontSize: 13,
    },
});
