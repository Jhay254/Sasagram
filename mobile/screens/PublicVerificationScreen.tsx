import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function PublicVerificationScreen({ navigation }: any) {
    const [contentHash, setContentHash] = useState('');
    const [scanning, setScanning] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<any>(null);

    const startScanning = async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        if (status === 'granted') {
            setScanning(true);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setScanning(false);
        // Extract hash from scanned URL
        const hash = data.split('/').pop() || '';
        setContentHash(hash);
        verifyContent(hash);
    };

    const verifyContent = async (hash?: string) => {
        const hashToVerify = hash || contentHash;
        if (!hashToVerify) return;

        setVerifying(true);
        setResult(null);

        try {
            const response = await fetch(`/api/blockchain/verify-public/${hashToVerify}`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error verifying:', error);
            setResult({ verified: false, error: 'Failed to verify content' });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verify Content</Text>
                <View style={{ width: 24 }} />
            </View>

            {scanning ? (
                <View style={styles.scannerContainer}>
                    <BarCodeScanner
                        onBarCodeScanned={handleBarCodeScanned}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <TouchableOpacity style={styles.cancelScanButton} onPress={() => setScanning(false)}>
                        <Text style={styles.cancelScanText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.inputSection}>
                        <Text style={styles.sectionTitle}>Enter Content Hash</Text>
                        <TextInput
                            style={styles.input}
                            value={contentHash}
                            onChangeText={setContentHash}
                            placeholder="0x..."
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
                                <Ionicons name="qr-code" size={20} color="#FFF" />
                                <Text style={styles.scanButtonText}>Scan QR Code</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.verifyButton}
                                onPress={() => verifyContent()}
                                disabled={!contentHash || verifying}
                            >
                                {verifying ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                                        <Text style={styles.verifyButtonText}>Verify</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {result && (
                        <View style={styles.resultSection}>
                            {result.verified ? (
                                <View style={styles.verifiedResult}>
                                    <View style={styles.verifiedIcon}>
                                        <Ionicons name="shield-checkmark" size={64} color="#4CAF50" />
                                    </View>
                                    <Text style={styles.verifiedTitle}>✓ Verified on Blockchain</Text>
                                    <Text style={styles.verifiedSubtitle}>
                                        This content is authentic and has been verified on Polygon
                                    </Text>

                                    <View style={styles.detailsCard}>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Creator:</Text>
                                            <Text style={styles.detailValue}>
                                                {result.creator?.substring(0, 8)}...
                                                {result.creator?.substring(result.creator.length - 6)}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Verified:</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(result.timestamp).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Type:</Text>
                                            <Text style={styles.detailValue}>{result.contentType}</Text>
                                        </View>
                                    </View>

                                    {result.blockchainUrl && (
                                        <TouchableOpacity
                                            style={styles.blockchainButton}
                                            onPress={() => Linking.openURL(result.blockchainUrl)}
                                        >
                                            <Ionicons name="open" size={16} color="#8247E5" />
                                            <Text style={styles.blockchainButtonText}>View on Polygonscan</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.unverifiedResult}>
                                    <View style={styles.unverifiedIcon}>
                                        <Ionicons name="alert-circle" size={64} color="#F44336" />
                                    </View>
                                    <Text style={styles.unverifiedTitle}>Not Verified</Text>
                                    <Text style={styles.unverifiedSubtitle}>
                                        This content hash was not found on the blockchain
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#007AFF" />
                        <Text style={styles.infoText}>
                            Public verification allows anyone to verify content authenticity using blockchain
                            records. No account required.
                        </Text>
                    </View>
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
    scannerContainer: {
        flex: 1,
    },
    cancelScanButton: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 24,
    },
    cancelScanText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    inputSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    actions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 12,
    },
    scanButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        padding: 16,
        borderRadius: 12,
    },
    scanButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    verifyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
    },
    verifyButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    resultSection: {
        marginBottom: 24,
    },
    verifiedResult: {
        backgroundColor: '#4CAF5020',
        padding: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4CAF50',
        alignItems: 'center',
    },
    verifiedIcon: {
        marginBottom: 16,
    },
    verifiedTitle: {
        color: '#4CAF50',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    verifiedSubtitle: {
        color: '#4CAF50',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        color: '#999',
        fontSize: 14,
    },
    detailValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    blockchainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#8247E520',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    blockchainButtonText: {
        color: '#8247E5',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    unverifiedResult: {
        backgroundColor: '#F4433620',
        padding: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#F44336',
        alignItems: 'center',
    },
    unverifiedIcon: {
        marginBottom: 16,
    },
    unverifiedTitle: {
        color: '#F44336',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    unverifiedSubtitle: {
        color: '#F44336',
        fontSize: 14,
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#007AFF20',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    infoText: {
        color: '#007AFF',
        fontSize: 12,
        lineHeight: 18,
        marginLeft: 12,
        flex: 1,
    },
});
