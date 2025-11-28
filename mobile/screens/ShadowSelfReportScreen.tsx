import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ReactNativeBiometrics from 'react-native-biometrics';

export default function ShadowSelfReportScreen({ route, navigation }: any) {
    const { reportId } = route.params;
    const [report, setReport] = useState<any>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const authenticateAndLoad = async () => {
        try {
            // Load token first
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                Alert.alert('Error', 'Please log in again');
                navigation.goBack();
                return;
            }
            setToken(storedToken);

            // Biometric auth required
            const rnBiometrics = new ReactNativeBiometrics();
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: 'Authenticate to view Shadow Self',
                cancelButtonText: 'Cancel',
            });

            if (!success) {
                navigation.goBack();
                return;
            }

            setAuthenticated(true);
            loadReport();
        } catch (error) {
            console.error('Authentication error:', error);
            navigation.goBack();
        }
    };

    const loadReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/shadow-self/reports/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setReport(data);

            // Log access
            await fetch('/api/security/screenshot-attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'view',
                    reportId,
                }),
            });
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        authenticateAndLoad();
    }, []);

    if (!authenticated || loading || !report) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                    {authenticated ? 'Loading Shadow Self...' : 'Authenticating...'}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Watermark Overlay */}
            <View style={styles.watermarkOverlay} pointerEvents="none">
                <Text style={styles.watermark}>CONFIDENTIAL • {report.watermark?.id || 'PROTECTED'}</Text>
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shadow Self Report</Text>
                <Ionicons name="shield-checkmark" size={24} color="#F44336" />
            </View>

            <View style={styles.securityBanner}>
                <Ionicons name="warning" size={16} color="#F44336" />
                <Text style={styles.securityText}>
                    Forensically watermarked • Screenshots prohibited • Access logged
                </Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.summaryText}>{report.summary}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Deleted Content ({report.deletedContent?.length || 0} items)
                    </Text>
                    {report.deletedContent?.map((item: any, index: number) => (
                        <View key={index} style={styles.deletedItem}>
                            <View style={styles.deletedHeader}>
                                <Ionicons name="trash" size={16} color="#F44336" />
                                <Text style={styles.deletedType}>{item.contentType}</Text>
                                <Text style={styles.deletedDate}>
                                    Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={styles.deletedContent}>{item.content}</Text>
                            {item.deletionReason && (
                                <Text style={styles.deletionReason}>Reason: {item.deletionReason}</Text>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Public vs. Private Analysis</Text>
                    <View style={styles.comparisonGrid}>
                        <View style={styles.comparisonColumn}>
                            <Text style={styles.comparisonLabel}>Public Persona</Text>
                            {report.publicStats?.map((stat: any, idx: number) => (
                                <Text key={idx} style={styles.comparisonStat}>
                                    {stat.label}: {stat.value}
                                </Text>
                            ))}
                        </View>
                        <View style={styles.comparisonDivider} />
                        <View style={styles.comparisonColumn}>
                            <Text style={styles.comparisonLabel}>Private Self</Text>
                            {report.privateStats?.map((stat: any, idx: number) => (
                                <Text key={idx} style={styles.comparisonStat}>
                                    {stat.label}: {stat.value}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Psychological Insights</Text>
                    {report.insights?.map((insight: string, index: number) => (
                        <View key={index} style={styles.insightCard}>
                            <Ionicons name="bulb" size={20} color="#FFD700" />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.mentalHealthSection}>
                    <Ionicons name="heart" size={24} color="#E91E63" />
                    <View style={styles.mentalHealthContent}>
                        <Text style={styles.mentalHealthTitle}>Mental Health Resources</Text>
                        <Text style={styles.mentalHealthText}>
                            Exploring deleted content can be emotionally challenging. If you need support:
                        </Text>
                        <TouchableOpacity style={styles.resourceButton}>
                            <Text style={styles.resourceButtonText}>📞 Crisis Hotline: 988</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.resourceButton}>
                            <Text style={styles.resourceButtonText}>💬 Chat with a Counselor</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.reportMeta}>
                    <Text style={styles.metaText}>Report ID: {report.id}</Text>
                    <Text style={styles.metaText}>
                        Generated: {new Date(report.createdAt).toLocaleString()}
                    </Text>
                    <Text style={styles.metaText}>
                        Expires: {new Date(report.expiresAt).toLocaleString()}
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                        Alert.alert(
                            'Delete Report?',
                            'This will permanently delete this Shadow Self report and all its data.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        await fetch(`/api/shadow-self/reports/${reportId}`, {
                                            method: 'DELETE',
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        navigation.goBack();
                                    },
                                },
                            ]
                        );
                    }}
                >
                    <Ionicons name="trash" size={18} color="#F44336" />
                    <Text style={styles.deleteButtonText}>Delete Report</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    watermarkOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    watermark: {
        color: '#FFFFFF10',
        fontSize: 48,
        fontWeight: 'bold',
        transform: [{ rotate: '-45deg' }],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#FFF',
        fontSize: 16,
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
        fontSize: 18,
        fontWeight: '600',
    },
    securityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4433620',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F44336',
    },
    securityText: {
        color: '#F44336',
        fontSize: 11,
        marginLeft: 8,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    summaryText: {
        color: '#CCC',
        fontSize: 16,
        lineHeight: 24,
    },
    deletedItem: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#F44336',
    },
    deletedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    deletedType: {
        color: '#F44336',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
    deletedDate: {
        color: '#666',
        fontSize: 12,
        marginLeft: 'auto',
    },
    deletedContent: {
        color: '#FFF',
        fontSize: 14,
        marginBottom: 8,
    },
    deletionReason: {
        color: '#999',
        fontSize: 12,
        fontStyle: 'italic',
    },
    comparisonGrid: {
        flexDirection: 'row',
    },
    comparisonColumn: {
        flex: 1,
    },
    comparisonDivider: {
        width: 1,
        backgroundColor: '#333',
        marginHorizontal: 12,
    },
    comparisonLabel: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    comparisonStat: {
        color: '#CCC',
        fontSize: 14,
        marginBottom: 6,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    insightText: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 12,
        flex: 1,
    },
    mentalHealthSection: {
        flexDirection: 'row',
        backgroundColor: '#E91E6320',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E91E63',
    },
    mentalHealthContent: {
        flex: 1,
        marginLeft: 12,
    },
    mentalHealthTitle: {
        color: '#E91E63',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    mentalHealthText: {
        color: '#E91E63',
        fontSize: 14,
        marginBottom: 12,
    },
    resourceButton: {
        backgroundColor: '#E91E63',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    resourceButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    reportMeta: {
        padding: 16,
    },
    metaText: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    footer: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4433620',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
    },
    deleteButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
