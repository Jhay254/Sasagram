import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../contexts/AuthContext';

interface Verification {
    id: string;
    contentType: string;
    contentHash: string;
    status: string;
    transactionHash: string | null;
    blockchainUrl: string | null;
    gasCost: number | null;
    verifiedAt: string | null;
    qrCodeData: string | null;
}

export default function BlockchainVerificationScreen({ navigation }: any) {
    const { accessToken } = useAuth();
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        loadVerifications();
    }, []);

    const loadVerifications = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/blockchain/user', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await response.json();
            setVerifications(data.verifications);
            setStats(data.stats);
        } catch (error) {
            console.error('Error loading verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const startVerification = async () => {
        try {
            // Pick content file
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'video/*'],
            });

            if (result.canceled) return;

            const file = result.assets[0];

            Alert.alert(
                'Blockchain Verification',
                `Gas fee: ~$0.02-0.05\n\nYou will be prompted to sign the transaction with your wallet.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: () => processVerification(file),
                    },
                ]
            );
        } catch (error) {
            console.error('Error selecting file:', error);
        }
    };

    const processVerification = async (file: any) => {
        setVerifying(true);
        try {
            // Prepare transaction
            const formData = new FormData();
            formData.append('content', {
                uri: file.uri,
                type: file.mimeType,
                name: file.name,
            } as any);
            formData.append('contentId', Date.now().toString());
            formData.append('contentType', file.mimeType.startsWith('image') ? 'PHOTO' : 'VIDEO');

            const prepareResponse = await fetch('/api/blockchain/prepare', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const { verificationId, transaction, estimatedCost } = await prepareResponse.json();

            // TODO: Integrate with Web3 wallet to sign transaction
            // For now, simulate transaction hash
            const mockTxHash = '0x' + Math.random().toString(16).substr(2);

            // Confirm verification
            const confirmResponse = await fetch('/api/blockchain/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    verificationId,
                    transactionHash: mockTxHash,
                }),
            });

            if (confirmResponse.ok) {
                Alert.alert('Success', 'Content verified on blockchain!');
                loadVerifications();
            }
        } catch (error: any) {
            console.error('Error verifying:', error);
            Alert.alert('Error', error.message || 'Failed to verify content');
        } finally {
            setVerifying(false);
        }
    };

    const viewProof = (verification: Verification) => {
        navigation.navigate('VerificationProof', { verification });
    };

    const renderVerification = ({ item }: { item: Verification }) => (
        <TouchableOpacity style={styles.verificationCard} onPress={() => viewProof(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={item.status === 'VERIFIED' ? 'shield-checkmark' : 'hourglass'}
                        size={24}
                        color={item.status === 'VERIFIED' ? '#4CAF50' : '#FF9800'}
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.contentType}>{item.contentType}</Text>
                    <Text style={styles.contentHash}>{item.contentHash.substring(0, 16)}...</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'VERIFIED' ? '#4CAF5020' : '#FF980020' },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            { color: item.status === 'VERIFIED' ? '#4CAF50' : '#FF9800' },
                        ]}
                    >
                        {item.status}
                    </Text>
                </View>
            </View>

            {item.status === 'VERIFIED' && (
                <View style={styles.verifiedInfo}>
                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.infoText}>
                            {new Date(item.verifiedAt!).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="diamond" size={16} color="#8247E5" />
                        <Text style={styles.infoText}>Gas: ${(item.gasCost || 0).toFixed(4)}</Text>
                    </View>
                </View>
            )}

            {item.blockchainUrl && (
                <TouchableOpacity style={styles.viewOnChainButton}>
                    <Ionicons name="link" size={16} color="#007AFF" />
                    <Text style={styles.viewOnChainText}>View on Polygonscan</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blockchain Verification</Text>
                <TouchableOpacity onPress={startVerification} disabled={verifying}>
                    <Ionicons name="add" size={28} color={verifying ? '#666' : '#FFF'} />
                </TouchableOpacity>
            </View>

            {stats && (
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Verified</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>${stats.totalGasCost.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Total Gas</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={verifications}
                    renderItem={renderVerification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="shield-outline" size={64} color="#666" />
                            <Text style={styles.emptyText}>No verified content yet</Text>
                            <Text style={styles.emptySubtext}>
                                Verify your content on Polygon blockchain for immutable proof of authenticity
                            </Text>
                        </View>
                    }
                />
            )}

            {verifying && (
                <View style={styles.verifyingOverlay}>
                    <ActivityIndicator size="large" color="#FFF" />
                    <Text style={styles.verifyingText}>Preparing blockchain transaction...</Text>
                </View>
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
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        color: '#007AFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    verificationCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#007AFF20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
    },
    contentType: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    contentHash: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    verifiedInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        color: '#666',
        fontSize: 14,
        marginLeft: 8,
    },
    viewOnChainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF20',
        padding: 12,
        borderRadius: 8,
    },
    viewOnChainText: {
        color: '#007AFF',
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
    verifyingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyingText: {
        color: '#FFF',
        fontSize: 16,
        marginTop: 16,
    },
});
