import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

export default function BiographyGenerationScreen({ navigation }: any) {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');

    // Mock data - replace with actual API calls
    const connectedSources = [
        { name: 'Instagram', dataPoints: 45, icon: '📸' },
        { name: 'Twitter', dataPoints: 32, icon: '🐦' },
        { name: 'Gmail', dataPoints: 18, icon: '📧' },
    ];

    const totalDataPoints = connectedSources.reduce((sum, source) => sum + source.dataPoints, 0);

    const handleGenerateBiography = async () => {
        setIsGenerating(true);
        setCurrentStep('Analyzing your data...');
        setProgress(0);

        // Simulate generation progress
        const steps = [
            { step: 'Analyzing your data...', progress: 20 },
            { step: 'Creating biography outline...', progress: 40 },
            { step: 'Generating Chapter 1...', progress: 55 },
            { step: 'Generating Chapter 2...', progress: 70 },
            { step: 'Generating Chapter 3...', progress: 85 },
            { step: 'Extracting timeline events...', progress: 95 },
            { step: 'Finalizing your biography...', progress: 100 },
        ];

        for (const { step, progress: prog } of steps) {
            setCurrentStep(step);
            setProgress(prog);
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        // Navigate to viewer
        setTimeout(() => {
            navigation.navigate('BiographyViewer');
        }, 500);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Generate Your Biography</Text>
                    <Text style={styles.subtitle}>
                        Transform your digital memories into a compelling life story
                    </Text>

                    {!isGenerating ? (
                        <>
                            {/* Data Summary */}
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Available Data</Text>
                                <Text style={styles.dataCount}>{totalDataPoints}</Text>
                                <Text style={styles.dataLabel}>data points ready</Text>
                            </View>

                            {/* Connected Sources */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Connected Sources</Text>
                                {connectedSources.map((source, index) => (
                                    <View key={index} style={styles.sourceCard}>
                                        <Text style={styles.sourceIcon}>{source.icon}</Text>
                                        <View style={styles.sourceInfo}>
                                            <Text style={styles.sourceName}>{source.name}</Text>
                                            <Text style={styles.sourceData}>{source.dataPoints} items</Text>
                                        </View>
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* What to Expect */}
                            <View style={styles.infoCard}>
                                <Text style={styles.infoTitle}>What to Expect</Text>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoBullet}>✨</Text>
                                    <Text style={styles.infoText}>5-7 chapters covering different life periods</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoBullet}>📖</Text>
                                    <Text style={styles.infoText}>Narrative-style storytelling from your data</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoBullet}>⏱️</Text>
                                    <Text style={styles.infoText}>Generation takes 1-2 minutes</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Text style={styles.infoBullet}>✏️</Text>
                                    <Text style={styles.infoText}>You can edit and refine after generation</Text>
                                </View>
                            </View>

                            {/* Generate Button */}
                            <TouchableOpacity
                                style={styles.generateButton}
                                onPress={handleGenerateBiography}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.generateGradient}
                                >
                                    <Text style={styles.generateText}>Generate Biography</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Generation Progress */}
                            <View style={styles.progressCard}>
                                <ActivityIndicator size="large" color="#FFF" style={styles.spinner} />
                                <Text style={styles.progressTitle}>Creating Your Story</Text>
                                <Text style={styles.progressStep}>{currentStep}</Text>

                                {/* Progress Bar */}
                                <View style={styles.progressBarContainer}>
                                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                                </View>
                                <Text style={styles.progressText}>{progress}%</Text>

                                <Text style={styles.progressNote}>
                                    This may take a minute or two. Please don't close the app.
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: 20,
    },
    backText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 32,
        lineHeight: 24,
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    summaryTitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dataCount: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#FFF',
    },
    dataLabel: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    sourceCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sourceIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    sourceInfo: {
        flex: 1,
    },
    sourceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    sourceData: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    checkmark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    infoBullet: {
        fontSize: 20,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    generateButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
    },
    generateGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    generateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    progressCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginTop: 40,
    },
    spinner: {
        marginBottom: 24,
    },
    progressTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    progressStep: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 24,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    progressNote: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
});
