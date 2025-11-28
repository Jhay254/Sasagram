import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function DeveloperPortalScreen({ navigation }: any) {
    const [featureEnabled, setFeatureEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKey, setNewKey] = useState({ name: '', scopes: [] });

    useEffect(() => {
        checkFeatureStatus();
    }, []);

    const checkFeatureStatus = async () => {
        try {
            const response = await axios.get('/api/api-licensing/feature-status');
            setFeatureEnabled(response.data.enabled);

            if (response.data.enabled) {
                loadAPIKeys();
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking feature:', error);
            setLoading(false);
        }
    };

    const loadAPIKeys = async () => {
        try {
            const response = await axios.get('/api/api-licensing/keys');
            setApiKeys(response.data.apiKeys);
        } catch (error) {
            console.error('Error loading API keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const createAPIKey = async () => {
        try {
            const response = await axios.post('/api/api-licensing/keys', newKey);

            // Copy key to clipboard (only shown once!)
            Clipboard.setString(response.data.apiKey.key);

            Alert.alert(
                'API Key Created',
                'Your API key has been copied to clipboard. Save it securely - you won\'t see it again!',
                [{ text: 'OK', onPress: () => setShowCreateModal(false) }]
            );

            loadAPIKeys();
        } catch (error) {
            Alert.alert('Error', 'Failed to create API key');
        }
    };

    if (!featureEnabled) {
        return (
            <View style={styles.comingSoonContainer}>
                <LinearGradient colors={['#0F172A', '#020617']} style={styles.comingSoonGradient}>
                    <Ionicons name="code-slash" size={80} color="#3B82F6" />
                    <Text style={styles.comingSoonTitle}>API Licensing</Text>
                    <Text style={styles.comingSoonSubtitle}>COMING SOON</Text>

                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            <Text style={styles.featureText}>Narrative Generation API</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            <Text style={styles.featureText}>Sentiment Analysis API</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            <Text style={styles.featureText}>Pattern Recognition API</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            <Text style={styles.featureText}>Developer portal & documentation</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            <Text style={styles.featureText}>Usage tracking & billing</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            <Text style={styles.featureText}>Rate limiting & quotas</Text>
                        </View>
                    </View>

                    <View style={styles.notifyBox}>
                        <Text style={styles.notifyText}>
                            Monetize our AI via APIs. Narrative generation, sentiment analysis, and pattern
                            recognition available for developers.
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    }

    // ACTIVE UI
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Developer Portal</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {apiKeys.map((key) => (
                    <View key={key.id} style={styles.keyCard}>
                        <View style={styles.keyHeader}>
                            <Text style={styles.keyName}>{key.name}</Text>
                            <View style={[styles.tierBadge, { backgroundColor: key.tier === 'PRO' ? '#8B5CF6' : '#6B7280' }]}>
                                <Text style={styles.tierText}>{key.tier}</Text>
                            </View>
                        </View>

                        <View style={styles.keyRow}>
                            <Text style={styles.keyLabel}>Key:</Text>
                            <Text style={styles.keyPrefix}>{key.keyPrefix}••••••••</Text>
                        </View>

                        <View style={styles.keyRow}>
                            <Text style={styles.keyLabel}>Requests:</Text>
                            <Text style={styles.keyValue}>{key.totalRequests.toLocaleString()}</Text>
                        </View>

                        <View style={styles.keyRow}>
                            <Text style={styles.keyLabel}>Rate Limit:</Text>
                            <Text style={styles.keyValue}>{key.rateLimit}/hour</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.revokeButton}
                            onPress={() => {
                                Alert.alert('Revoke API Key', 'Are you sure?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Revoke',
                                        style: 'destructive',
                                        onPress: async () => {
                                            await axios.delete(`/api/api-licensing/keys/${key.id}`);
                                            loadAPIKeys();
                                        },
                                    },
                                ]);
                            }}
                        >
                            <Text style={styles.revokeButtonText}>Revoke</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            {/* Create API Key Modal */}
            <Modal visible={showCreateModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create API Key</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Key Name"
                            value={newKey.name}
                            onChangeText={(text) => setNewKey({ ...newKey, name: text })}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={createAPIKey}>
                                <Text style={styles.confirmButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    comingSoonContainer: { flex: 1 },
    comingSoonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    comingSoonTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginTop: 24 },
    comingSoonSubtitle: { fontSize: 18, color: '#93C5FD', marginTop: 8, letterSpacing: 2 },
    featuresList: { marginTop: 40, width: '100%' },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    featureText: { fontSize: 16, color: '#FFFFFF', marginLeft: 12 },
    notifyBox: { backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: 20, borderRadius: 12, marginTop: 32 },
    notifyText: { fontSize: 14, color: '#FFFFFF', textAlign: 'center', lineHeight: 20 },
    backButton: { marginTop: 32, paddingVertical: 12 },
    backButtonText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    createButton: { backgroundColor: '#3B82F6', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    keyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
    keyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    keyName: { fontSize: 18, fontWeight: '600', color: '#111827' },
    tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    tierText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
    keyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    keyLabel: { fontSize: 14, color: '#6B7280' },
    keyPrefix: { fontSize: 14, color: '#111827', fontFamily: 'monospace' },
    keyValue: { fontSize: 14, color: '#111827' },
    revokeButton: { marginTop: 12, padding: 10, backgroundColor: '#FEE2E2', borderRadius: 8, alignItems: 'center' },
    revokeButtonText: { color: '#DC2626', fontSize: 14, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
    input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelButton: { flex: 1, backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
    confirmButton: { flex: 1, backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center' },
    confirmButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
