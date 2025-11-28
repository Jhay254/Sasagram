import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function BeforeIDieModeScreen({ navigation }: any) {
    const [featureEnabled, setFeatureEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dms, setDms] = useState<any>(null);
    const [trusteeEmail, setTrusteeEmail] = useState('');
    const [trusteeName, setTrusteeName] = useState('');
    const [checkInFrequency, setCheckInFrequency] = useState('MONTHLY');

    useEffect(() => {
        checkFeatureStatus();
    }, []);

    const checkFeatureStatus = async () => {
        try {
            const response = await axios.get('/api/before-i-die/feature-status');
            setFeatureEnabled(response.data.enabled);

            if (response.data.enabled) {
                loadConfig();
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking feature:', error);
            setLoading(false);
        }
    };

    const loadConfig = async () => {
        try {
            // Load existing config
            setLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const setupSwitch = async () => {
        try {
            const response = await axios.post('/api/before-i-die/switch/setup', {
                trusteeEmail,
                trusteeName,
                checkInFrequency,
            });
            setDms(response.data.switch);
            Alert.alert('Success', 'Dead Man\'s Switch activated');
        } catch (error) {
            Alert.alert('Error', 'Failed to setup switch');
        }
    };

    const doCheckIn = async () => {
        try {
            await axios.post('/api/before-i-die/switch/checkin');
            Alert.alert('Success', 'Check-in recorded. See you next month!');
        } catch (error) {
            Alert.alert('Error', 'Check-in failed');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF4444" />
            </View>
        );
    }

    // COMING SOON UI
    if (!featureEnabled) {
        return (
            <View style={styles.comingSoonContainer}>
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.comingSoonGradient}>
                    <Ionicons name="hourglass" size={80} color="#EF4444" />
                    <Text style={styles.comingSoonTitle}>Before I Die Mode</Text>
                    <Text style={styles.comingSoonSubtitle}>COMING SOON</Text>

                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                            <Text style={styles.featureText}>Dead Man's Switch (monthly check-in)</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                            <Text style={styles.featureText}>Trustee verification system</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                            <Text style={styles.featureText}>Posthumous content release</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                            <Text style={styles.featureText}>Final chapter auto-generation</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                            <Text style={styles.featureText}>Private letters to loved ones</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                            <Text style={styles.featureText}>Video message scheduling</Text>
                        </View>
                    </View>

                    <View style={styles.notifyBox}>
                        <Text style={styles.notifyText}>
                            Your story lives forever. Schedule content to be released after you're gone—final messages,
                            hidden chapters, untold stories. Your legacy, on your terms.
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
        <ScrollView style={styles.container}>
            <LinearGradient colors={['#1F2937', '#111827']} style={styles.header}>
                <Ionicons name="hourglass" size={48} color="#EF4444" />
                <Text style={styles.headerTitle}>Before I Die Mode</Text>
                <Text style={styles.headerSubtitle}>Your eternal legacy</Text>
            </LinearGradient>

            {/* Dead Man's Switch Setup */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dead Man's Switch</Text>
                <Text style={styles.sectionSubtitle}>
                    Monthly check-ins to confirm you're okay. If you miss check-ins, your content is released.
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Trustee Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Name of person who will verify"
                        value={trusteeName}
                        onChangeText={setTrusteeName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Trustee Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="trustee@example.com"
                        value={trusteeEmail}
                        onChangeText={setTrusteeEmail}
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Check-In Frequency</Text>
                    <View style={styles.frequencyButtons}>
                        {['WEEKLY', 'MONTHLY', 'QUARTERLY'].map((freq) => (
                            <TouchableOpacity
                                key={freq}
                                style={[
                                    styles.frequencyButton,
                                    checkInFrequency === freq && styles.frequencyButtonActive,
                                ]}
                                onPress={() => setCheckInFrequency(freq)}
                            >
                                <Text
                                    style={[
                                        styles.frequencyButtonText,
                                        checkInFrequency === freq && styles.frequencyButtonTextActive,
                                    ]}
                                >
                                    {freq}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.setupButton} onPress={setupSwitch}>
                    <Text style={styles.setupButtonText}>Activate Switch</Text>
                </TouchableOpacity>
            </View>

            {/* Check-In */}
            {dms && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monthly Check-In</Text>
                    <Text style={styles.checkInStatus}>
                        Next check-in due: {new Date(dms.nextCheckInDue).toLocaleDateString()}
                    </Text>

                    <TouchableOpacity style={styles.checkInButton} onPress={doCheckIn}>
                        <Ionicons name="heart" size={24} color="#FFFFFF" />
                        <Text style={styles.checkInButtonText}>I'm Still Here</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Posthumous Content */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posthumous Content</Text>
                <Text style={styles.sectionSubtitle}>Schedule content to be released after you're gone</Text>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('SchedulePosthumousPost')}
                >
                    <Ionicons name="document-text" size={32} color="#6366F1" />
                    <Text style={styles.actionCardTitle}>Final Chapter</Text>
                    <Text style={styles.actionCardSubtext}>Auto-generated from your life</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('WritePosthumousLetter')}
                >
                    <Ionicons name="mail" size={32} color="#8B5CF6" />
                    <Text style={styles.actionCardTitle}>Private Letters</Text>
                    <Text style={styles.actionCardSubtext}>Messages to loved ones</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('RecordVideoMessage')}
                >
                    <Ionicons name="videocam" size={32} color="#EC4899" />
                    <Text style={styles.actionCardTitle}>Video Messages</Text>
                    <Text style={styles.actionCardSubtext}>Final words on camera</Text>
                </TouchableOpacity>
            </View>
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
        color: '#FCA5A5',
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
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#FCA5A5',
        marginTop: 8,
    },
    section: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    frequencyButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    frequencyButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    frequencyButtonActive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    frequencyButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    frequencyButtonTextActive: {
        color: '#FFFFFF',
    },
    setupButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    setupButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    checkInStatus: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
    },
    checkInButton: {
        flexDirection: 'row',
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkInButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    actionCard: {
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    actionCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 12,
    },
    actionCardSubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
});
