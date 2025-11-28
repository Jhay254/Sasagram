import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface DashboardData {
    reputation: {
        score: number;
        trend: string;
        totalMentions: number;
        positive: number;
        negative: number;
    };
    nftStats: {
        totalMinted: number;
        totalVolume: number;
        floorPrice?: number;
    };
    revenue: {
        monthly: number;
        subscribers: number;
    };
    recentMentions: Array<{
        id: string;
        source: string;
        snippet: string;
        sentimentScore: number;
        publishedAt: string;
    }>;
}

export default function CelebrityDashboardScreen({ navigation }: any) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await axios.get('/api/celebrity/dashboard');
            setData(response.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReputationColor = (score: number) => {
        if (score >= 75) return '#10B981';
        if (score >= 50) return '#F59E0B';
        return '#EF4444';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'IMPROVING') return 'trending-up';
        if (trend === 'DECLINING') return 'trending-down';
        return 'remove';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!data) return null;

    return (
        <ScrollView style={styles.container}>
            {/* Reputation Score Card */}
            <View style={styles.reputationCard}>
                <View style={styles.reputationHeader}>
                    <Text style={styles.cardTitle}>Reputation Score</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SentimentAnalysis')}>
                        <Text style={styles.viewAllText}>View Details →</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.reputationScoreContainer}>
                    <Text
                        style={[
                            styles.reputationScore,
                            { color: getReputationColor(data.reputation.score) },
                        ]}
                    >
                        {data.reputation.score}
                    </Text>
                    <View style={styles.trendBadge}>
                        <Ionicons
                            name={getTrendIcon(data.reputation.trend)}
                            size={20}
                            color={data.reputation.trend === 'IMPROVING' ? '#10B981' : '#EF4444'}
                        />
                        <Text style={styles.trendText}>{data.reputation.trend}</Text>
                    </View>
                </View>

                <View style={styles.sentimentRow}>
                    <View style={styles.sentimentItem}>
                        <Ionicons name="happy" size={24} color="#10B981" />
                        <Text style={styles.sentimentCount}>{data.reputation.positive}</Text>
                        <Text style={styles.sentimentLabel}>Positive</Text>
                    </View>
                    <View style={styles.sentimentItem}>
                        <Ionicons name="sad" size={24} color="#EF4444" />
                        <Text style={styles.sentimentCount}>{data.reputation.negative}</Text>
                        <Text style={styles.sentimentLabel}>Negative</Text>
                    </View>
                    <View style={styles.sentimentItem}>
                        <Ionicons name="chatbubbles" size={24} color="#6366F1" />
                        <Text style={styles.sentimentCount}>{data.reputation.totalMentions}</Text>
                        <Text style={styles.sentimentLabel}>Total</Text>
                    </View>
                </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => navigation.navigate('NFTCollection')}
                >
                    <Ionicons name="diamond" size={32} color="#8B5CF6" />
                    <Text style={styles.statValue}>{data.nftStats.totalMinted}</Text>
                    <Text style={styles.statLabel}>NFTs Minted</Text>
                    {data.nftStats.floorPrice && (
                        <Text style={styles.statSubtext}>
                            Floor: ${data.nftStats.floorPrice.toLocaleString()}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.statCard}>
                    <Ionicons name="cash" size={32} color="#10B981" />
                    <Text style={styles.statValue}>
                        ${(data.nftStats.totalVolume / 1000).toFixed(1)}k
                    </Text>
                    <Text style={styles.statLabel}>NFT Volume</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="people" size={32} color="#F59E0B" />
                    <Text style={styles.statValue}>{data.revenue.subscribers}</Text>
                    <Text style={styles.statLabel}>Subscribers</Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons name="trending-up" size={32} color="#6366F1" />
                    <Text style={styles.statValue}>
                        ${(data.revenue.monthly / 1000).toFixed(1)}k
                    </Text>
                    <Text style={styles.statLabel}>Monthly Revenue</Text>
                </View>
            </View>

            {/* Recent Media Mentions */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Recent Media Mentions</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SentimentAnalysis')}>
                        <Text style={styles.viewAllText}>View All →</Text>
                    </TouchableOpacity>
                </View>

                {data.recentMentions.slice(0, 3).map((mention) => (
                    <View key={mention.id} style={styles.mentionCard}>
                        <View style={styles.mentionHeader}>
                            <Text style={styles.mentionSource}>{mention.source}</Text>
                            <View
                                style={[
                                    styles.sentimentBadge,
                                    {
                                        backgroundColor:
                                            mention.sentimentScore > 0.25
                                                ? '#D1FAE5'
                                                : mention.sentimentScore < -0.25
                                                    ? '#FEE2E2'
                                                    : '#F3F4F6',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.sentimentBadgeText,
                                        {
                                            color:
                                                mention.sentimentScore > 0.25
                                                    ? '#059669'
                                                    : mention.sentimentScore < -0.25
                                                        ? '#DC2626'
                                                        : '#6B7280',
                                        },
                                    ]}
                                >
                                    {mention.sentimentScore > 0 ? 'Positive' : 'Negative'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.mentionSnippet} numberOfLines={2}>
                            {mention.snippet}
                        </Text>
                        <Text style={styles.mentionDate}>
                            {new Date(mention.publishedAt).toLocaleDateString()}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('NFTCollection')}
                >
                    <Ionicons name="add-circle" size={24} color="#8B5CF6" />
                    <Text style={styles.actionButtonText}>Mint Career Moment NFT</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('LegacyPlan')}
                >
                    <Ionicons name="document-text" size={24} color="#6366F1" />
                    <Text style={styles.actionButtonText}>Update Legacy Plan</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CareerAnalytics')}
                >
                    <Ionicons name="stats-chart" size={24} color="#10B981" />
                    <Text style={styles.actionButtonText}>View Analytics</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reputationCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reputationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    viewAllText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    reputationScoreContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    reputationScore: {
        fontSize: 64,
        fontWeight: 'bold',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    trendText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    sentimentRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    sentimentItem: {
        alignItems: 'center',
    },
    sentimentCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    sentimentLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        margin: 8,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
    },
    statSubtext: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    mentionCard: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    mentionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    mentionSource: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    sentimentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    sentimentBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    mentionSnippet: {
        fontSize: 14,
        color: '#111827',
        marginBottom: 6,
    },
    mentionDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    actionButtonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
    },
});
