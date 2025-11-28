import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VaultItem {
    id: string;
    title: string;
    contentType: string;
    requiresBiometric: boolean;
    requiresPIN: boolean;
    accessTimeLimit: number;
    viewCount: number;
    lastAccessedAt: string | null;
    createdAt: string;
}

export default function VaultScreen({ navigation }: any) {
    const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVaultContent();
        setupScreenshotDetection();
    }, []);

    const loadVaultContent = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch('/api/vault', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setVaultItems(data.vaultContent);
        } catch (error) {
            console.error('Error loading vault:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupScreenshotDetection = () => {
        const subscription = ScreenCapture.addScreenshotListener(() => {
            // Warning mode: Just notify, don't block
            Alert.alert(
                'Screenshot Detected',
                'Screenshots of vault content are tracked for security purposes.',
                [{ text: 'OK' }]
            );

            // Log violation
            logScreenshotViolation();
        });

        return () => {
            subscription.remove();
        };
    };

    const logScreenshotViolation = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            await fetch('/api/security/screenshot-violation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    contentType: 'VAULT',
                    violationType: 'SCREENSHOT',
                }),
            });
        } catch (error) {
            console.error('Error logging violation:', error);
        }
    };

    const openVaultItem = (item: VaultItem) => {
        navigation.navigate('VaultContentView', { vaultId: item.id });
    };

    const getContentIcon = (type: string) => {
        const icons: Record<string, string> = {
            TEXT: 'document-text',
            IMAGE: 'image',
            VIDEO: 'videocam',
            DOCUMENT: 'folder',
        };
        return icons[type] || 'document';
    };

    const formatTimeLimit = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min access`;
    };

    const renderVaultItem = ({ item }: { item: VaultItem }) => (
        <TouchableOpacity style={styles.vaultCard} onPress={() => openVaultItem(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name={getContentIcon(item.contentType) as any} size={24} color="#007AFF" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardType}>{item.contentType}</Text>
                </View>
                <Ionicons name="lock-closed" size={20} color="#F44336" />
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.securityBadges}>
                    {item.requiresBiometric && (
                        <View style={styles.badge}>
                            <Ionicons name="finger-print" size={12} color="#007AFF" />
                            <Text style={styles.badgeText}>Biometric</Text>
                        </View>
                    )}
                    {item.requiresPIN && (
                        <View style={styles.badge}>
                            <Ionicons name="keypad" size={12} color="#007AFF" />
                            <Text style={styles.badgeText}>PIN</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.timeLimit}>{formatTimeLimit(item.accessTimeLimit)}</Text>
            </View>

            <View style={styles.cardStats}>
                <Text style={styles.statText}>Views: {item.viewCount}</Text>
                {item.lastAccessedAt && (
                    <Text style={styles.statText}>
                        Last: {new Date(item.lastAccessedAt).toLocaleDateString()}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vault</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreateVaultContent')}>
                    <Ionicons name="add" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.securityBanner}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                <Text style={styles.securityText}>
                    AES-256 Encrypted • Time-Limited Access • Full Audit Trail
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading vault...</Text>
                </View>
            ) : (
                <FlatList
                    data={vaultItems}
                    renderItem={renderVaultItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="lock-open-outline" size={64} color="#666" />
                            <Text style={styles.emptyText}>No vault content yet</Text>
                            <Text style={styles.emptySubtext}>
                                Store sensitive content with enhanced security
                            </Text>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={() => navigation.navigate('CreateVaultContent')}
                            >
                                <Ionicons name="add" size={20} color="#FFF" />
                                <Text style={styles.createButtonText}>Create Vault Item</Text>
                            </TouchableOpacity>
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
    securityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF5020',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#4CAF50',
    },
    securityText: {
        color: '#4CAF50',
        fontSize: 12,
        marginLeft: 8,
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
    vaultCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#F44336',
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
    cardTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cardType: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    securityBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#007AFF',
        fontSize: 10,
        marginLeft: 4,
    },
    timeLimit: {
        color: '#FF9800',
        fontSize: 12,
    },
    cardStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    statText: {
        color: '#666',
        fontSize: 12,
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
        marginBottom: 24,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
