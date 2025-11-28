import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function LeaderboardScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch('/api/tagging/leaderboard');
            // const data = await response.json();
            // setLeaderboard(data.data);

            // Mock data
            setLeaderboard([
                {
                    id: '1',
                    user: { firstName: 'Sarah', lastName: 'Johnson', avatarUrl: null },
                    score: 98.5,
                    tagsCreated: 145,
                    tagsReceived: 203,
                    verifiedTagCount: 187,
                },
                {
                    id: '2',
                    user: { firstName: 'Mike', lastName: 'Chen', avatarUrl: null },
                    score: 95.2,
                    tagsCreated: 132,
                    tagsReceived: 178,
                    verifiedTagCount: 165,
                },
                {
                    id: '3',
                    user: { firstName: 'Emma', lastName: 'Davis', avatarUrl: null },
                    score: 92.8,
                    tagsCreated: 118,
                    tagsReceived: 156,
                    verifiedTagCount: 142,
                },
            ]);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return null;
        }
    };

    const renderLeaderboardItem = ({ item, index }: any) => {
        const rank = index + 1;
        const medal = getMedalIcon(rank);

        return (
            <View style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.rankContainer}>
                    {medal ? (
                        <Text style={styles.medal}>{medal}</Text>
                    ) : (
                        <Text style={[styles.rank, { color: theme.colors.textSecondary }]}>
                            #{rank}
                        </Text>
                    )}
                </View>

                <View style={[styles.avatar, { backgroundColor: theme.colors.border }]}>
                    {item.user.avatarUrl ? (
                        <Image source={{ uri: item.user.avatarUrl }} style={styles.avatarImage} />
                    ) : (
                        <Ionicons name="person" size={24} color={theme.colors.textSecondary} />
                    )}
                </View>

                <View style={styles.userInfo}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                        {item.user.firstName} {item.user.lastName}
                    </Text>
                    <View style={styles.stats}>
                        <View style={styles.statItem}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
                            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                                {item.verifiedTagCount} verified
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="people" size={14} color={theme.colors.textSecondary} />
                            <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                                {item.tagsCreated} tagged
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.scoreContainer}>
                    <Text style={[styles.score, { color: theme.colors.primary }]}>
                        {item.score.toFixed(1)}%
                    </Text>
                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                        Score
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <View style={{ width: 28 }} />
            </LinearGradient>

            <View style={styles.infoBox}>
                <Ionicons name="trophy" size={24} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    Memory Completeness Score - Most collaborative storytellers
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Loading leaderboard...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderLeaderboardItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    list: {
        padding: 16,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    medal: {
        fontSize: 28,
    },
    rank: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    userInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    stats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
    },
    scoreContainer: {
        alignItems: 'center',
    },
    score: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    scoreLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
});
