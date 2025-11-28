import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface DataSource {
    id: string;
    type: string;
    status: string;
    providerUsername?: string;
    lastSyncAt?: string;
    syncCount: number;
    createdAt: string;
}

interface Provider {
    id: string;
    name: string;
    icon: string;
    description: string;
    gradient: readonly [string, string, ...string[]];
}

const PROVIDERS: Provider[] = [
    {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        description: 'Photos, videos, and stories',
        gradient: ['#833ab4', '#fd1d1d', '#fcb045'],
    },
    {
        id: 'twitter',
        name: 'Twitter / X',
        icon: '𝕏',
        description: 'Tweets and interactions',
        gradient: ['#1DA1F2', '#14171A'],
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: '👤',
        description: 'Posts, photos, and life events',
        gradient: ['#4267B2', '#0D47A1'],
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        description: 'Professional posts and connections',
        gradient: ['#0077B5', '#00669C'],
    },
    {
        id: 'google',
        name: 'Gmail',
        icon: '📧',
        description: 'Email metadata (zero-knowledge)',
        gradient: ['#EA4335', '#FBBC05'],
    },
    {
        id: 'microsoft',
        name: 'Outlook',
        icon: '📬',
        description: 'Email metadata (zero-knowledge)',
        gradient: ['#0078D4', '#00A4EF'],
    },
];

export default function DataSourcesScreen({ navigation }: any) {
    const { accessToken } = useAuth();
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);

    useEffect(() => {
        fetchDataSources();
    }, []);

    const fetchDataSources = async () => {
        try {
            const response = await axios.get(`${API_URL}/oauth/data-sources`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setDataSources(response.data.dataSources);
        } catch (error) {
            console.error('Error fetching data sources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (providerId: string) => {
        setConnecting(providerId);
        try {
            // Get OAuth URL from backend
            const response = await axios.get(`${API_URL}/oauth/${providerId}/initiate`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            const { authUrl } = response.data;

            // Open OAuth URL in browser
            const supported = await Linking.canOpenURL(authUrl);
            if (supported) {
                await Linking.openURL(authUrl);

                // Show instructions
                Alert.alert(
                    'Authorization Required',
                    `Please authorize Lifeline in your browser. Once complete, return to the app to see your connected account.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Refresh data sources after a delay
                                setTimeout(() => {
                                    fetchDataSources();
                                }, 2000);
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', 'Could not open authorization URL');
            }
        } catch (error: any) {
            Alert.alert('Connection Failed', error.response?.data?.error || 'Failed to connect account');
        } finally {
            setConnecting(null);
        }
    };

    const handleDisconnect = async (dataSourceId: string, providerName: string) => {
        Alert.alert(
            'Disconnect Account',
            `Are you sure you want to disconnect your ${providerName} account?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/oauth/data-sources/${dataSourceId}`, {
                                headers: { Authorization: `Bearer ${accessToken}` },
                            });
                            fetchDataSources();
                            Alert.alert('Success', 'Account disconnected successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to disconnect account');
                        }
                    },
                },
            ]
        );
    };

    const isConnected = (providerId: string): DataSource | undefined => {
        return dataSources.find(
            (ds) => ds.type.toLowerCase() === providerId && ds.status === 'CONNECTED'
        );
    };

    const renderProvider = (provider: Provider) => {
        const connected = isConnected(provider.id);
        const isConnectingThis = connecting === provider.id;

        return (
            <View key={provider.id} style={styles.providerCard}>
                <LinearGradient
                    colors={provider.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.providerGradient}
                >
                    <View style={styles.providerContent}>
                        <View style={styles.providerHeader}>
                            <Text style={styles.providerIcon}>{provider.icon}</Text>
                            <View style={styles.providerInfo}>
                                <Text style={styles.providerName}>{provider.name}</Text>
                                <Text style={styles.providerDescription}>{provider.description}</Text>
                                {connected && (
                                    <View style={styles.connectedBadge}>
                                        <Text style={styles.connectedText}>
                                            ✓ {connected.providerUsername || 'Connected'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {connected ? (
                            <View style={styles.connectedActions}>
                                <View style={styles.syncInfo}>
                                    <Text style={styles.syncText}>
                                        {connected.syncCount > 0
                                            ? `Synced ${connected.syncCount} times`
                                            : 'Ready to sync'}
                                    </Text>
                                    {connected.lastSyncAt && (
                                        <Text style={styles.syncDate}>
                                            Last: {new Date(connected.lastSyncAt).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.disconnectButton}
                                    onPress={() => handleDisconnect(connected.id, provider.name)}
                                >
                                    <Text style={styles.disconnectText}>Disconnect</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.connectButton}
                                onPress={() => handleConnect(provider.id)}
                                disabled={isConnectingThis}
                            >
                                {isConnectingThis ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.connectText}>Connect</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    const connectedCount = dataSources.filter((ds) => ds.status === 'CONNECTED').length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Connect Your Data</Text>
                        <Text style={styles.subtitle}>
                            {connectedCount} of {PROVIDERS.length} sources connected
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>🔒</Text>
                    <Text style={styles.infoTitle}>Your Data is Secure</Text>
                    <Text style={styles.infoText}>
                        All connections use industry-standard OAuth. Your passwords are never stored. Email
                        connections use zero-knowledge architecture - we only extract metadata, never read your
                        messages.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Social Media</Text>
                {PROVIDERS.filter((p) => ['instagram', 'twitter', 'facebook', 'linkedin'].includes(p.id)).map(
                    renderProvider
                )}

                <Text style={styles.sectionTitle}>Email (Zero-Knowledge)</Text>
                {PROVIDERS.filter((p) => ['google', 'microsoft'].includes(p.id)).map(renderProvider)}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    backButtonText: {
        fontSize: 24,
        color: '#FFF',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        marginTop: 8,
    },
    providerCard: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    providerGradient: {
        padding: 20,
    },
    providerContent: {
        gap: 16,
    },
    providerHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    providerIcon: {
        fontSize: 40,
        marginRight: 16,
    },
    providerInfo: {
        flex: 1,
    },
    providerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    providerDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
    },
    connectedBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    connectedText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
    },
    connectedActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    syncInfo: {
        flex: 1,
    },
    syncText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    syncDate: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    connectButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderColor: '#FFF',
        minWidth: 120,
        alignItems: 'center',
    },
    connectText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    disconnectButton: {
        backgroundColor: 'rgba(244, 67, 54, 0.9)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    disconnectText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    bottomPadding: {
        height: 40,
    },
});
