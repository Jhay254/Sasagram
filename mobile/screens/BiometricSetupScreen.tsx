import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReactNativeBiometrics from 'react-native-biometrics';

export default function BiometricSetupScreen({ navigation }: any) {
    const [biometricType, setBiometricType] = useState<string>('');
    const [isSetup, setIsSetup] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            const rnBiometrics = new ReactNativeBiometrics();
            const { available, biometryType } = await rnBiometrics.isSensorAvailable();

            if (available) {
                setBiometricType(biometryType || 'Unknown');
            } else {
                Alert.alert(
                    'Biometrics Not Available',
                    'Your device does not support biometric authentication. Please use a compatible device for Platinum tier.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Error checking biometric support:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupBiometric = async () => {
        try {
            const rnBiometrics = new ReactNativeBiometrics();

            // Create keys for biometric signature
            const { publicKey } = await rnBiometrics.createKeys();

            // Test authentication
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: `Confirm your ${biometricType}`,
                cancelButtonText: 'Cancel',
            });

            if (success) {
                setIsSetup(true);
                Alert.alert(
                    'Biometric Setup Complete',
                    'Your biometric authentication has been enabled. You can now access Platinum features.',
                    [
                        {
                            text: 'Finish Setup',
                            onPress: () => navigation.replace('Home'),
                        },
                    ]
                );
            } else {
                Alert.alert('Setup Failed', 'Biometric authentication was not successful');
            }
        } catch (error) {
            console.error('Error setting up biometric:', error);
            Alert.alert('Error', 'Failed to setup biometric authentication');
        }
    };

    const getBiometricIcon = () => {
        if (biometricType.includes('FaceID') || biometricType.includes('Face')) {
            return 'scan';
        }
        return 'finger-print';
    };

    const getBiometricName = () => {
        if (biometricType.includes('FaceID') || biometricType.includes('Face')) {
            return 'Face ID';
        }
        if (biometricType.includes('TouchID') || biometricType.includes('Fingerprint')) {
            return 'Touch ID / Fingerprint';
        }
        return 'Biometric';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Checking device compatibility...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Biometric Setup</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name={getBiometricIcon() as any} size={80} color="#007AFF" />
                </View>

                <Text style={styles.title}>Enable {getBiometricName()}</Text>
                <Text style={styles.subtitle}>
                    Required for accessing Platinum tier Shadow Self features
                </Text>

                <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                        <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Enhanced Security</Text>
                            <Text style={styles.infoText}>
                                Your biometric data stays on your device and is never sent to our servers
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="lock-closed" size={24} color="#007AFF" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Re-authentication Required</Text>
                            <Text style={styles.infoText}>
                                You'll need to authenticate every time you access Shadow Self reports
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons name="alert-circle" size={24} color="#FF9800" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Fallback Protection</Text>
                            <Text style={styles.infoText}>
                                If biometric fails 3 times, you'll need to re-enter your password
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.setupButton, isSetup && styles.setupButtonDisabled]}
                    onPress={setupBiometric}
                    disabled={isSetup}
                >
                    <Ionicons name={getBiometricIcon() as any} size={20} color="#FFF" />
                    <Text style={styles.setupButtonText}>
                        {isSetup ? 'Setup Complete ✓' : `Enable ${getBiometricName()}`}
                    </Text>
                </TouchableOpacity>

                {!isSetup && (
                    <Text style={styles.helperText}>
                        Tap the button above and follow the on-screen instructions
                    </Text>
                )}
            </View>

            <View style={styles.footer}>
                <Ionicons name="information-circle" size={16} color="#666" />
                <Text style={styles.footerText}>
                    Biometric authentication is required for Platinum tier compliance and cannot be disabled
                </Text>
            </View>
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
    content: {
        flex: 1,
        padding: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 40,
    },
    title: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    infoSection: {
        marginBottom: 40,
    },
    infoItem: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    infoContent: {
        flex: 1,
        marginLeft: 16,
    },
    infoTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    infoText: {
        color: '#999',
        fontSize: 14,
        lineHeight: 20,
    },
    setupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
    },
    setupButtonDisabled: {
        backgroundColor: '#4CAF50',
    },
    setupButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    helperText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    footerText: {
        color: '#666',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },
});
