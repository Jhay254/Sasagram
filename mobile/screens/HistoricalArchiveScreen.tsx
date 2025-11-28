import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

interface Archive {
    id: string;
    name: string;
    description?: string;
    category: string;
    totalItems: number;
    items: any[];
}

export default function HistoricalArchiveScreen({ navigation }: any) {
    const [featureEnabled, setFeatureEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [archives, setArchives] = useState<Archive[]>([]);

    useEffect(() => {
        checkFeatureStatus();
    }, []);

    const checkFeatureStatus = async () => {
        try {
            const response = await axios.get('/api/historical-archive/feature-status');
            setFeatureEnabled(response.data.enabled);

            if (response.data.enabled) {
                loadArchives();
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking feature:', error);
            setLoading(false);
        }
    };

    const loadArchives = async () => {
        try {
            const response = await axios.get('/api/historical-archive/user');
            setArchives(response.data.archives);
        } catch (error) {
            console.error('Error loading archives:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickDocuments = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                multiple: true,
            });

            if (!result.canceled) {
                // Upload and process
                console.log('Selected files:', result);
            }
        } catch (error) {
            console.error('Error picking documents:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    // COMING SOON UI
    if (!featureEnabled) {
        return (
            <View style={styles.comingSoonContainer}>
                <LinearGradient colors={['#78350F', '#451A03']} style={styles.comingSoonGradient}>
                    <Ionicons name="albums" size={80} color="#F59E0B" />
                    <Text style={styles.comingSoonTitle}>Historical Archive</Text>
                    <Text style={styles.comingSoonSubtitle}>COMING SOON</Text>

                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>Bulk photo/document import</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>OCR for old letters & documents</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>AI-powered organization</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>Face detection & tagging</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>Public archive access control</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>Educational licensing</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                            <Text style={styles.featureText}>Family tree integration</Text>
                        </View>
                    </View>

                    <View style={styles.notifyBox}>
                        <Text style={styles.notifyText}>
                            Preserve family history. Upload old photos, letters, and documents. AI will organize,
                            transcribe, and make them searchable for future generations.
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
                <Text style={styles.headerTitle}>Historical Archives</Text>
                <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateArchive')}>
                    <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {archives.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="albums-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No archives yet</Text>
                    <TouchableOpacity
                        style={styles.importButton}
                        onPress={() => navigation.navigate('CreateArchive')}
                    >
                        <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                        <Text style={styles.importButtonText}>Import Photos</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={archives}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.archiveCard}
                            onPress={() => navigation.navigate('ArchiveDetails', { archiveId: item.id })}
                        >
                            <View style={styles.archiveHeader}>
                                <Ionicons name="folder" size={32} color="#F59E0B" />
                                <View style={styles.archiveInfo}>
                                    <Text style={styles.archiveName}>{item.name}</Text>
                                    <Text style={styles.archiveCategory}>{item.category}</Text>
                                </View>
                            </View>

                            {item.description && (
                                <Text style={styles.archiveDescription} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            )}

                            <View style={styles.archiveFooter}>
                                <Text style={styles.archiveStats}>{item.totalItems} items</Text>

                                {item.items && item.items.length > 0 && (
                                    <View style={styles.thumbnails}>
                                        {item.items.slice(0, 3).map((i: any, idx: number) => (
                                            <Image
                                                key={idx}
                                                source={{ uri: i.thumbnailUrl || i.mediaUrl }}
                                                style={styles.thumbnail}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={pickDocuments}>
                <Ionicons name="camera" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
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
    // COMING SOON Styles
    comingSoonContainer: {
        flex: 1,
    },
    comingSoonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    comingSoonTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 24,
    },
    comingSoonSubtitle: {
        fontSize: 18,
        color: '#FDE68A',
        marginTop: 8,
        letterSpacing: 2,
    },
    featuresList: {
        marginTop: 40,
        width: '100%',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureText: {
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 12,
    },
    notifyBox: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        padding: 20,
        borderRadius: 12,
        marginTop: 32,
    },
    notifyText: {
        fontSize: 14,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 20,
    },
    backButton: {
        marginTop: 32,
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    // ACTIVE UI Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    createButton: {
        backgroundColor: '#F59E0B',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginVertical: 16,
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    importButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    listContainer: {
        padding: 16,
    },
    archiveCard: {
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
    archiveHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    archiveInfo: {
        flex: 1,
        marginLeft: 12,
    },
    archiveName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    archiveCategory: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    archiveDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    archiveFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    archiveStats: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    thumbnails: {
        flexDirection: 'row',
        gap: 4,
    },
    thumbnail: {
        width: 40,
        height: 40,
        borderRadius: 4,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
