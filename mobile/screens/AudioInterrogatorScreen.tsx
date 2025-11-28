import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import axios from 'axios';

interface Question {
    id: string;
    questionText: string;
    questionType: string;
    answered: boolean;
    answerText?: string;
}

interface Session {
    id: string;
    questions: Question[];
    status: string;
}

export default function AudioInterrogatorScreen({ navigation }: any) {
    const [featureEnabled, setFeatureEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        checkFeatureStatus();
        requestAudioPermissions();
    }, []);

    const checkFeatureStatus = async () => {
        try {
            const response = await axios.get('/api/audio-interrogator/feature-status');
            setFeatureEnabled(response.data.enabled);

            if (response.data.enabled) {
                loadSession();
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking feature:', error);
            setLoading(false);
        }
    };

    const requestAudioPermissions = async () => {
        await Audio.requestPermissionsAsync();
    };

    const loadSession = async () => {
        try {
            const response = await axios.post('/api/audio-interrogator/session', {});
            setSession(response.data.session);
        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);

            // Pulse animation while recording
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (uri) {
            await submitRecording(uri);
        }

        setRecording(null);
        pulseAnim.setValue(1);
    };

    const submitRecording = async (audioUri: string) => {
        const currentQuestion = session?.questions.find((q) => !q.answered);
        if (!currentQuestion) return;

        try {
            const formData = new FormData();
            formData.append('audio', {
                uri: audioUri,
                type: 'audio/m4a',
                name: 'recording.m4a',
            } as any);

            await axios.post(
                `/api/audio-interrogator/question/${currentQuestion.id}/respond`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            // Reload session
            loadSession();
        } catch (error) {
            console.error('Error submitting recording:', error);
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
                <LinearGradient colors={['#8B5CF6', '#EC4899']} style={styles.comingSoonGradient}>
                    <Ionicons name="mic" size={80} color="#FFFFFF" />
                    <Text style={styles.comingSoonTitle}>Audio Interrogator</Text>
                    <Text style={styles.comingSoonSubtitle}>COMING SOON</Text>

                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>AI voice diary assistant</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Context-aware questioning</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Emotion detection from voice</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Auto-transcription with Whisper AI</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.featureText}>Smart follow-up questions</Text>
                        </View>
                    </View>

                    <View style={styles.notifyBox}>
                        <Text style={styles.notifyText}>
                            Your AI diary companion will ask probing questions to help you capture richer
                            memories. Speak naturally, and it'll know what to ask next.
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
    const currentQuestion = session?.questions.find((q) => !q.answered);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#8B5CF6', '#6366F1']} style={styles.header}>
                <Text style={styles.headerTitle}>Audio Diary</Text>
                <Text style={styles.headerSubtitle}>Speak your mind</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {currentQuestion && (
                    <View style={styles.questionCard}>
                        <Ionicons name="chatbubble-ellipses" size={32} color="#8B5CF6" />
                        <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
                        <View style={styles.questionType}>
                            <Text style={styles.questionTypeText}>{currentQuestion.questionType}</Text>
                        </View>
                    </View>
                )}

                {/* Previous Q&A */}
                {session?.questions
                    .filter((q) => q.answered)
                    .reverse()
                    .map((q) => (
                        <View key={q.id} style={styles.answeredCard}>
                            <Text style={styles.answeredQuestion}>{q.questionText}</Text>
                            <Text style={styles.answeredText}>{q.answerText}</Text>
                        </View>
                    ))}
            </ScrollView>

            {/* Recording Button */}
            <View style={styles.recordingContainer}>
                <TouchableOpacity
                    style={styles.recordButton}
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                >
                    <Animated.View
                        style={[
                            styles.recordButtonInner,
                            {
                                transform: [{ scale: pulseAnim }],
                                backgroundColor: isRecording ? '#EF4444' : '#8B5CF6',
                            },
                        ]}
                    >
                        <Ionicons
                            name={isRecording ? 'stop' : 'mic'}
                            size={40}
                            color="#FFFFFF"
                        />
                    </Animated.View>
                </TouchableOpacity>
                <Text style={styles.recordHint}>
                    {isRecording ? 'Tap to finish' : 'Tap to answer'}
                </Text>
            </View>
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
        color: '#F3E8FF',
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
        padding: 40,
        paddingTop: 60,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#E0E7FF',
        marginTop: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    questionText: {
        fontSize: 20,
        color: '#111827',
        marginTop: 16,
        lineHeight: 28,
    },
    questionType: {
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
    },
    questionTypeText: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '600',
    },
    answeredCard: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#8B5CF6',
    },
    answeredQuestion: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    answeredText: {
        fontSize: 16,
        color: '#111827',
    },
    recordingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    recordButtonInner: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordHint: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
});
