import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface MergerSuggestion {
    id: string;
    suggestedUser: {
        id: string;
        name: string;
        profilePictureUrl: string;
    };
    matchScore: number;
    reason: string;
    previewTitle: string;
    sharedEventId: string;
}

export default function MergerSuggestionsScreen({ navigation }: any) {
    const [suggestions, setSuggestions] = useState<MergerSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch('/api/collaboration/suggestions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setSuggestions(data.suggestions);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadSuggestions();
    };

    const dismissSuggestion = async (suggestionId: string) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`/api/collaboration/suggestions/${suggestionId}/dismiss`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuggestions(suggestions.filter(s => s.id !== suggestionId));
        } catch (error) {
            console.error('Error dismissing suggestion:', error);
        }
    };

    const inviteFromSuggestion = (suggestion: MergerSuggestion) => {
        navigation.navigate('CollaborationInvite', {
            preSelectedEvent: suggestion.sharedEventId,
            recipientId: suggestion.suggestedUser.id,
        });
    };

    const renderSuggestion = ({ item }: { item: MergerSuggestion }) => {
        const matchPercentage = Math.round(item.matchScore * 100);

        return (
            <View style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                    <View style={styles.matchBadge}>
                        <Ionicons name="flash" size={16} color="#FFD700" />
                        <Text style={styles.matchText}>{matchPercentage}% Match</Text>
                    </View>
                    <TouchableOpacity onPress={() => dismissSuggestion(item.id)}>
                        <Ionicons name="close-circle" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.previewTitle}>{item.previewTitle}</Text>
                <Text style={styles.collaboratorName}>with {item.suggestedUser.name}</Text>
                <Text style={styles.reason}>{item.reason}</Text>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.dismissButton}
                        onPress={() => dismissSuggestion(item.id)}
                    >
                        <Text style={styles.dismissButtonText}>Not Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.inviteButton}
                        onPress={() => inviteFromSuggestion(item)}
                    >
                        <Ionicons name="paper-plane" size={16} color="#FFF" />
                        <Text style={styles.inviteButtonText}>Send Invite</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Suggestions</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
                <Text style={styles.infoText}>
                    AI-detected opportunities to create merged stories with people who shared your experiences
                </Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Finding collaboration opportunities...</Text>
                </View>
            ) : (
                <FlatList
                    data={suggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="bulb-outline" size={64} color="#666" />
                            <Text style={styles.emptyText}>No suggestions yet</Text>
                            <Text style={styles.emptySubtext}>
                                We'll notify you when we find great collaboration opportunities
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    infoText: {
        color: '#FFF',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        fontSize: 16,
    },
    list: {
        padding: 16,
    },
    suggestionCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    matchText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    previewTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    collaboratorName: {
        color: '#007AFF',
        fontSize: 14,
        marginBottom: 8,
    },
    reason: {
        color: '#999',
        fontSize: 14,
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    dismissButton: {
        flex: 1,
        backgroundColor: '#333',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    dismissButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    inviteButton: {
        flex: 2,
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inviteButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
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
});
