import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function ConnectionsListScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch('/api/memory-graph/connections');
            // const data = await response.json();
            // setConnections(data.data);

            // Mock data for now
            setConnections([
                {
                    id: '1',
                    otherUser: {
                        id: 'user1',
                        firstName: 'Sarah',
                        lastName: 'Johnson',
                        avatarUrl: null,
                    },
                    strength: 85.5,
                    sharedEventCount: 12,
                    lastSharedEvent: new Date('2024-11-15'),
                },
                {
                    id: '2',
                    otherUser: {
                        id: 'user2',
                        firstName: 'Mike',
                        lastName: 'Chen',
                        avatarUrl: null,
                    },
                    strength: 72.3,
                    sharedEventCount: 8,
                    lastSharedEvent: new Date('2024-11-10'),
                },
            ]);
        } catch (error) {
            console.error('Error fetching connections:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderConnection = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.connectionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('SharedEvents', { connectionId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                {item.otherUser.avatarUrl ? (
                    <Image source={{ uri: item.otherUser.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                        <Ionicons name="person" size={28} color={theme.colors.textSecondary} />
                    </View>
                )}
            </View>

            <View style={styles.connectionInfo}>
                <Text style={[styles.name, { color: theme.colors.text }]}>
                    {item.otherUser.firstName} {item.otherUser.lastName}
                </Text>
                <Text style={[styles.stats, { color: theme.colors.textSecondary }]}>
                    {item.sharedEventCount} shared moment{item.sharedEventCount !== 1 ? 's' : ''}
                </Text>
                <View style={styles.strengthContainer}>
                    <View style={[styles.strengthBar, { backgroundColor: theme.colors.border }]}>
                        <View
                            style={[
                                styles.strengthFill,
                                {
                                    backgroundColor: theme.colors.primary,
                                    width: `${item.strength}%`,
                                },
                            ]}
                        />
                    </View>
                    <Text style={[styles.strengthText, { color: theme.colors.textSecondary }]}>
                        {item.strength.toFixed(0)}%
                    </Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Connections</Text>
                <TouchableOpacity
                    style={styles.graphButton}
                    onPress={() => navigation.navigate('NetworkGraph')}
                >
                    <Ionicons name="git-network" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Loading connections...
                    </Text>
                </View>
            ) : connections.length > 0 ? (
                <FlatList
                    data={connections}
                    renderItem={renderConnection}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="git-network-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No connections yet
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        Connect your data sources to discover shared memories with friends
                    </Text>
                </View>
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
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    graphButton: {
        width: 40,
        alignItems: 'flex-end',
    },
    list: {
        padding: 16,
    },
    connectionCard: {
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
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectionInfo: {
        flex: 1,
    },
    name: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    stats: {
        fontSize: 14,
        marginBottom: 8,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    strengthBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        width: 35,
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
