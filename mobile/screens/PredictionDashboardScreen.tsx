import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

interface Prediction {
    id: string;
    eventType: string;
    category: string;
    predictedDate: string;
    confidenceScore: number;
    description: string;
    modelName: string;
}

export default function PredictionDashboardScreen({ navigation }: any) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [featureEnabled, setFeatureEnabled] = useState(false);

    useEffect(() => {
        checkFeatureStatus();
    }, []);

    const checkFeatureStatus = async () => {
        try {
            const response = await axios.get('/api/predictions/feature-status');
            setFeatureEnabled(response.data.enabled);

            if (response.data.enabled) {
                loadPredictions();
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking feature:', error);
            setLoading(false);
        }
    };

    const loadPredictions = async () => {
        try {
            const response = await axios.get('/api/predictions/user');
            setPredictions(response.data.predictions);
        } catch (error) {
            console.error('Error loading predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePredictions = async () => {
        setLoading(true);
        try {
            await axios.post('/api/predictions/generate');
            loadPredictions();
        } catch (error) {
            console.error('Error generating predictions:', error);
            setLoading(false);
        }
    };

    const getEventIcon = (eventType: string) => {
        const icons: Record<string, any> = {
            JOB_CHANGE: 'briefcase',
            RELATIONSHIP_CHANGE: 'heart',
            RELOCATION: 'location',
            HEALTH_EVENT: 'fitness',
        };
        return icons[eventType] || 'flash';
    };

    const getEventColor = (eventType: string) => {
        const colors: Record<string, string> = {
            JOB_CHANGE: '#6366F1',
            RELATIONSHIP_CHANGE: '#EC4899',
            RELOCATION: '#10B981',
            HEALTH_EVENT: '#F59E0B',
        };
        return colors[eventType] || '#6B7280';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    // COMING SOON UI
    if (!featureEnabled) {
        return (
            <View style={styles.comingSoonContainer}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.comingSoonGradient}
                >
                    <Ionicons name="flash" size={80} color="#FFFFFF" />
                    <Text style={styles.comingSoonTitle}>Prediction Engine</Text>
                    <Text style={styles.comingSoonSubtitle}>COMING SOON</Text>

                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>AI-powered life event predictions</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Job change forecasting</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Relationship insights</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Lifestyle trend analysis</Text>
                        </View>
                    </View>

                    <View style={styles.notifyBox}>
                        <Text style={styles.notifyText}>
                            We're training our AI models. This feature will be available soon!
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>← Back to Dashboard</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    }

    // ACTIVE UI (when feature is enabled)
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Life Predictions</Text>
                <TouchableOpacity style={styles.generateButton} onPress={generatePredictions}>
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text style={styles.generateButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {predictions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="flash-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No predictions yet</Text>
                    <TouchableOpacity style={styles.generateFirstButton} onPress={generatePredictions}>
                        <Text style={styles.generateFirstButtonText}>Generate Predictions</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {predictions.map((prediction) => (
                        <View key={prediction.id} style={styles.predictionCard}>
                            <View
                                style={[
                                    styles.eventIcon,
                                    { backgroundColor: getEventColor(prediction.eventType) },
                                ]}
                            >
                                <Ionicons
                                    name={getEventIcon(prediction.eventType)}
                                    size={28}
                                    color="#FFFFFF"
                                />
                            </View>

                            <View style={styles.predictionContent}>
                                <View style={styles.predictionHeader}>
                                    <Text style={styles.eventType}>
                                        {prediction.eventType.replace(/_/g, ' ')}
                                    </Text>
                                    <View style={styles.confidenceBadge}>
                                        <Text style={styles.confidenceText}>
                                            {Math.round(prediction.confidenceScore * 100)}%
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.description}>{prediction.description}</Text>

                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                                    <Text style={styles.metaText}>
                                        Predicted: {new Date(prediction.predictedDate).toLocaleDateString()}
                                    </Text>
                                </View>

                                <View style={styles.metaRow}>
                                    <Ionicons name="analytics-outline" size={16} color="#9CA3AF" />
                                    <Text style={styles.metaText}>Model: {prediction.modelName}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </>
            )}
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
        color: '#E0E7FF',
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    generateButtonText: {
        color: '#FFFFFF',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginVertical: 16,
    },
    generateFirstButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    generateFirstButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    predictionCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    eventIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    predictionContent: {
        flex: 1,
    },
    predictionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventType: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        textTransform: 'capitalize',
    },
    confidenceBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    confidenceText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginLeft: 6,
    },
});
