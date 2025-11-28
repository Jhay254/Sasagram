import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Prediction {
    id: string;
    category: string;
    prediction: string;
    confidence: number;
    timeframe: string;
    reasoning: string;
    basedOn: string[];
}

export default function PredictionsScreen({ navigation }: any) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPredictions();
    }, []);

    const loadPredictions = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('/api/predictions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setPredictions(data.predictions);
        } catch (error) {
            console.error('Error loading predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence > 0.7) return '#4CAF50';
        if (confidence > 0.4) return '#FF9800';
        return '#F44336';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence > 0.7) return 'High';
        if (confidence > 0.4) return 'Medium';
        return 'Low';
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            CAREER: 'briefcase',
            RELATIONSHIP: 'heart',
            HEALTH: 'fitness',
            FINANCIAL: 'cash',
            PERSONAL: 'person',
        };
        return icons[category] || 'flash';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Generating predictions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Predictions</Text>
                <Ionicons name="help-circle" size={24} color="#666" />
            </View>

            <View style={styles.warningBanner}>
                <Ionicons name="warning" size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                    Predictions are estimates based on patterns. Not guaranteed outcomes.
                </Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {predictions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="telescope-outline" size={64} color="#666" />
                        <Text style={styles.emptyText}>No predictions available yet</Text>
                        <Text style={styles.emptySubtext}>
                            Build more history and we'll start making predictions
                        </Text>
                    </View>
                ) : (
                    predictions.map((prediction) => (
                        <View key={prediction.id} style={styles.predictionCard}>
                            <View style={styles.predictionHeader}>
                                <View style={styles.categoryBadge}>
                                    <Ionicons name={getCategoryIcon(prediction.category) as any} size={16} color="#FFF" />
                                    <Text style={styles.categoryText}>{prediction.category}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.confidenceBadge,
                                        { backgroundColor: getConfidenceColor(prediction.confidence) + '20' },
                                    ]}
                                >
                                    <Text style={[styles.confidenceText, { color: getConfidenceColor(prediction.confidence) }]}>
                                        {getConfidenceLabel(prediction.confidence)} Confidence
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.predictionText}>{prediction.prediction}</Text>

                            <View style={styles.timeframe}>
                                <Ionicons name="time" size={16} color="#666" />
                                <Text style={styles.timeframeText}>{prediction.timeframe}</Text>
                            </View>

                            <View style={styles.reasoning}>
                                <Text style={styles.reasoningTitle}>Why we think this:</Text>
                                <Text style={styles.reasoningText}>{prediction.reasoning}</Text>
                            </View>

                            <View style={styles.basedOn}>
                                <Text style={styles.basedOnTitle}>Based on:</Text>
                                {prediction.basedOn.map((item, index) => (
                                    <View key={index} style={styles.basedOnItem}>
                                        <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                                        <Text style={styles.basedOnText}>{item}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.predictionActions}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="bookmark-outline" size={18} color="#007AFF" />
                                    <Text style={styles.actionButtonText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="share-outline" size={18} color="#007AFF" />
                                    <Text style={styles.actionButtonText}>Share</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.disclaimer}>
                    <Ionicons name="alert-circle" size={20} color="#F44336" />
                    <Text style={styles.disclaimerText}>
                        <Text style={styles.disclaimerBold}>Important:</Text> These predictions are for
                        entertainment and self-reflection purposes only. They should not replace professional
                        advice from qualified experts in career, health, finance, or relationships.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
        marginTop: 16,
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
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF980020',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FF9800',
    },
    warningText: {
        color: '#FF9800',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    predictionCard: {
        backgroundColor: '#1a1a1a',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    predictionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    categoryText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    confidenceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    predictionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 26,
        marginBottom: 12,
    },
    timeframe: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeframeText: {
        color: '#666',
        fontSize: 14,
        marginLeft: 8,
    },
    reasoning: {
        marginBottom: 16,
    },
    reasoningTitle: {
        color: '#999',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    reasoningText: {
        color: '#CCC',
        fontSize: 14,
        lineHeight: 20,
    },
    basedOn: {
        marginBottom: 16,
    },
    basedOnTitle: {
        color: '#999',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    basedOnItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    basedOnText: {
        color: '#CCC',
        fontSize: 14,
        marginLeft: 8,
    },
    predictionActions: {
        flexDirection: 'row',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionButtonText: {
        color: '#007AFF',
        fontSize: 14,
        marginLeft: 6,
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
    disclaimer: {
        flexDirection: 'row',
        backgroundColor: '#F4433620',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
    },
    disclaimerText: {
        color: '#F44336',
        fontSize: 12,
        lineHeight: 18,
        marginLeft: 12,
        flex: 1,
    },
    disclaimerBold: {
        fontWeight: 'bold',
    },
});
