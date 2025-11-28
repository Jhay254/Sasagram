import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReactNativeBiometrics from 'react-native-biometrics';
import * as ScreenCapture from 'expo-screen-capture';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VaultContentViewScreen({ route, navigation }: any) {
    const { vaultId } = route.params;
    const [content, setContent] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        authenticateAndLoad();
        const subscription = setupScreenshotDetection();

        return () => {
            subscription?.remove();
        };
    }, []);

    const setupScreenshotDetection = () => {
        const subscription = ScreenCapture.addScreenshotListener(() => {
            // Stronger warning for vault content
            Alert.alert(
                '⚠️ Security Violation',
                'Screenshot of vault content detected and logged. Repeated violations may result in account restrictions.',
                [{ text: 'I Understand' }]
            );

            logScreenshotViolation();
        });

        return subscription;
    };

    const logScreenshotViolation = async () => {
        try {
            const userAccessToken = await AsyncStorage.getItem('accessToken');
            if (!userAccessToken) return;

            await fetch('/api/security/screenshot-violation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    contentType: 'VAULT_CONTENT',
                    contentId: vaultId,
                    violationType: 'SCREENSHOT',
                }),
            });
        } catch (error) {
            console.error('Error logging violation:', error);
        }
    };

    const authenticateAndLoad = async () => {
        setLoading(true);
        try {
            // Biometric authentication
            const rnBiometrics = new ReactNativeBiometrics();
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: 'Authenticate to access vault content',
                cancelButtonText: 'Cancel',
            });

            if (!success) {
                navigation.goBack();
                return;
            }

            // TODO: Also prompt for PIN if required

            // Access vault content
            const userAccessToken = await AsyncStorage.getItem('accessToken');
            const response = await fetch(`/api/vault/${vaultId}/access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userAccessToken}`,
                },
                body: JSON.stringify({
                    biometricVerified: true,
                    pinVerified: false, // TODO: Implement PIN
                    deviceId: 'device-id', // TODO: Get actual device ID
                    ipAddress: '0.0.0.0',
                }),
            });

            const data = await response.json();
            setContent(data.content);
            setAccessToken(data.accessToken);
            setExpiresAt(new Date(data.expiresAt));
            setAuthenticated(true);

            // Start countdown timer
            startExpirationCountdown(data.expiresIn);
        } catch (error: any) {
            console.error('Error accessing vault:', error);
            Alert.alert('Error', error.message || 'Failed to access vault content');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const startExpirationCountdown = (seconds: number) => {
        const interval = setInterval(() => {
            const remaining = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 1000) : 0;

            if (remaining <= 0) {
                clearInterval(interval);
                Alert.alert('Session Expired', 'Access time limit reached', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else if (remaining === 60) {
                Alert.alert('Warning', '1 minute remaining');
            }
        }, 1000);
    };

    const getRemainingTime = () => {
        if (!expiresAt) return '';
        const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading || !authenticated) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Authenticating...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Screenshot blocker overlay (visual deterrent) */}
            <View style={styles.watermarkOverlay} pointerEvents="none">
                <Text style={styles.watermark}>CONFIDENTIAL • VAULT</Text>
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vault Content</Text>
                <View style={styles.timerBadge}>
                    <Ionicons name="time" size={16} color="#FF9800" />
                    <Text style={styles.timerText}>{getRemainingTime()}</Text>
                </View>
            </View>

            <View style={styles.securityBanner}>
                <Ionicons name="warning" size={16} color="#F44336" />
                <Text style={styles.securityText}>
                    Screenshots tracked • Access expires in {getRemainingTime()}
                </Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <Text style={styles.content}>{content}</Text>
            </ScrollView>
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
        color: '#FFFFFF08',
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
        fontSize: 18,
        fontWeight: '600',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF980020',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    timerText: {
        color: '#FF9800',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
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
        padding: 20,
    },
    content: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 24,
    },
});
