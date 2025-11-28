import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import axios from 'axios';

interface Integration {
    id: string;
    provider: string;
    providerName?: string;
    status: string;
    lastSyncedAt?: string;
    syncEnabled: boolean;
    autoImport: boolean;
}

export default function CorporateIntegrationsScreen({ navigation }: any) {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            const response = await axios.get('/api/integrations');
            setIntegrations(response.data);
        } catch (error) {
            console.error('Error loading integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const connectIntegration = async (provider: string) => {
        try {
            // Get OAuth URL from backend
            const response = await axios.post(`/api/integrations/${provider}/auth`);
            const { authUrl } = response.data;

            // Open OAuth flow
            await Linking.openURL(authUrl);

            // Refresh list after OAuth (in production, use deep link callback)
            setTimeout(loadIntegrations, 3000);
        } catch (error) {
            console.error('Error connecting integration:', error);
            Alert.alert('Error', 'Failed to connect integration');
        }
    };

    const disconnectIntegration = async (integrationId: string) => {
        Alert.alert(
            'Disconnect Integration',
            'Are you sure? This will stop auto-importing timeline events.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/integrations/${integrationId}`);
                            loadIntegrations();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to disconnect');
                        }
                    },
                },
            ]
        );
    };

    const syncIntegration = async (integrationId: string) => {
        try {
            await axios.post(`/api/integrations/${integrationId}/sync`);
            Alert.alert('Success', 'Sync started');
            loadIntegrations();
        } catch (error) {
            Alert.alert('Error', 'Sync failed');
        }
    };

    const getProviderIcon = (provider: string) => {
        const icons: Record<string, any> = {
            SLACK: 'chatbox',
            GITHUB: 'logo-github',
            GOOGLE_WORKSPACE: 'logo-google',
            CUSTOM: 'cube',
        };
        return icons[provider] || 'link';
    };

    const getStatusColor = (status: string) => {
        if (status === 'CONNECTED') return '#10B981';
        if (status === 'SYNCING') return '#F59E0B';
        if (status === 'ERROR') return '#EF4444';
        return '#9CA3AF';
    };

    const renderIntegration = (integration: Integration) => (
        <View key={integration.id} style={styles.integrationCard}>
            <View style={styles.integrationHeader}>
                <View style={styles.integrationTitleRow}>
                    <Ionicons
                        name={getProviderIcon(integration.provider)}
                        size={32}
                        color="#6366F1"
                    />
                    <View style={styles.integrationInfo}>
                        <Text style={styles.integrationName}>
                            {integration.providerName || integration.provider}
                        </Text>
                        <View style={styles.statusRow}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: getStatusColor(integration.status) },
                                ]}
                            />
                            <Text style={styles.statusText}>{integration.status}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity onPress={() => disconnectIntegration(integration.id)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {integration.lastSyncedAt && (
                <Text style={styles.syncText}>
                    Last synced: {new Date(integration.lastSyncedAt).toLocaleString()}
                </Text>
            )}

            <View style={styles.integrationFooter}>
                <View style={styles.featureRow}>
                    <Ionicons
                        name={integration.syncEnabled ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={integration.syncEnabled ? '#10B981' : '#9CA3AF'}
                    />
                    <Text style={styles.featureText}>
                        Sync {integration.syncEnabled ? 'enabled' : 'disabled'}
                    </Text>
                </View>

                <View style={styles.featureRow}>
                    <Ionicons
                        name={integration.autoImport ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={integration.autoImport ? '#10B981' : '#9CA3AF'}
                    />
                    <Text style={styles.featureText}>
                        Auto-import {integration.autoImport ? 'on' : 'off'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={() => syncIntegration(integration.id)}
                    disabled={integration.status === 'SYNCING'}
                >
                    <Ionicons name="sync" size={18} color="#6366F1" />
                    <Text style={styles.syncButtonText}>Sync Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const availableProviders = [
        { provider: 'SLACK', name: 'Slack', description: 'Team communication & announcements' },
        { provider: 'GITHUB', name: 'GitHub', description: 'Code releases & development activity' },
        {
            provider: 'GOOGLE_WORKSPACE',
            name: 'Google Workspace',
            description: 'Calendar & team directory',
        },
    ];

    const connectedProviders = new Set(integrations.map((i) => i.provider));

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Connected Integrations */}
            {integrations.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Connected Integrations</Text>
                    {integrations.map(renderIntegration)}
                </View>
            )}

            {/* Available Integrations */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Integrations</Text>

                {availableProviders
                    .filter((p) => !connectedProviders.has(p.provider))
                    .map((provider) => (
                        <TouchableOpacity
                            key={provider.provider}
                            style={styles.availableCard}
                            onPress={() => connectIntegration(provider.provider)}
                        >
                            <Ionicons
                                name={getProviderIcon(provider.provider)}
                                size={40}
                                color="#6366F1"
                            />
                            <View style={styles.providerInfo}>
                                <Text style={styles.providerName}>{provider.name}</Text>
                                <Text style={styles.providerDescription}>{provider.description}</Text>
                            </View>
                            <Ionicons name="arrow-forward-circle" size={24} color="#6366F1" />
                        </TouchableOpacity>
                    ))}

                {availableProviders.every((p) => connectedProviders.has(p.provider)) && (
                    <View style={styles.allConnectedContainer}>
                        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                        <Text style={styles.allConnectedText}>All integrations connected!</Text>
                    </View>
                )}
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
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    integrationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    integrationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    integrationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    integrationInfo: {
        marginLeft: 12,
        flex: 1,
    },
    integrationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 13,
        color: '#6B7280',
    },
    syncText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 12,
    },
    integrationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#6B7280',
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    syncButtonText: {
        marginLeft: 4,
        fontSize: 13,
        color: '#6366F1',
        fontWeight: '600',
    },
    availableCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    providerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    providerDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    allConnectedContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    allConnectedText: {
        marginTop: 12,
        fontSize: 16,
        color: '#10B981',
        fontWeight: '600',
    },
});
