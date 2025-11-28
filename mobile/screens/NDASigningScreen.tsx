import React, { useState, useEffect } from 'react';
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

export default function NDASigningScreen({ navigation }: any) {
    const [ndaText, setNdaText] = useState('');
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);

    useEffect(() => {
        loadNDA();
    }, []);

    const loadNDA = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Authentication Error', 'Please log in again');
                navigation.navigate('Login');
                return;
            }

            const response = await fetch('/api/nda/current', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setNdaText(data.legalText);
        } catch (error) {
            console.error('Error loading NDA:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        if (isAtBottom && !scrolledToBottom) {
            setScrolledToBottom(true);
        }
    };

    const signWithBiometric = async () => {
        if (!scrolledToBottom) {
            Alert.alert('Please Read First', 'You must scroll to the bottom to read the entire NDA before signing.');
            return;
        }

        try {
            setSigning(true);

            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                Alert.alert('Authentication Error', 'Please log in again');
                navigation.navigate('Login');
                return;
            }

            // Authenticate with biometrics
            const rnBiometrics = new ReactNativeBiometrics();
            const { success } = await rnBiometrics.simplePrompt({
                promptMessage: 'Sign NDA with your biometric',
                cancelButtonText: 'Cancel',
            });

            if (!success) {
                Alert.alert('Authentication Failed', 'Biometric authentication was not successful');
                return;
            }

            // Sign NDA
            const response = await fetch('/api/nda/sign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    signatureData: {
                        method: 'biometric',
                        timestamp: new Date().toISOString(),
                    },
                }),
            });

            if (response.ok) {
                Alert.alert(
                    'NDA Signed',
                    'You have successfully signed the Non-Disclosure Agreement. Proceed to biometric setup.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => navigation.navigate('BiometricSetup'),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to sign NDA');
            }
        } catch (error) {
            console.error('Error signing NDA:', error);
            Alert.alert('Error', 'An error occurred while signing the NDA');
        } finally {
            setSigning(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Non-Disclosure Agreement</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.warningBanner}>
                <Ionicons name="alert-circle" size={20} color="#F44336" />
                <Text style={styles.warningText}>
                    Legally binding agreement. Read carefully before signing.
                </Text>
            </View>

            <ScrollView
                style={styles.ndaContainer}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <Text style={styles.ndaTitle}>SHADOW SELF FEATURE NON-DISCLOSURE AGREEMENT</Text>
                <Text style={styles.ndaVersion}>Version 1.0 - Effective Date: November 22, 2025</Text>

                <Text style={styles.ndaText}>
                    {ndaText || `
THIS AGREEMENT is entered into between Lifeline Inc. ("Company") and the subscriber ("User").

1. CONFIDENTIAL INFORMATION
Shadow Self reports contain highly sensitive personal content including:
- Deleted posts, messages, and media
- Private thoughts and censored content
- Psychological analysis and insights
- Content deliberately hidden from public view

2. NON-DISCLOSURE OBLIGATIONS
User agrees to:
a) Maintain strict confidentiality of all Shadow Self content
b) Not share, distribute, screenshot, or copy any Shadow Self reports
c) Not discuss specific content with third parties
d) Accept full responsibility for content security

3. TECHNICAL SAFEGUARDS
User acknowledges:
- Forensic watermarking on all views
- Screenshot detection and automatic account suspension
- Access logging with device fingerprinting
- Biometric authentication requirements

4. LIABILITY FOR VIOLATIONS
User agrees that:
- Each violation carries $100,000 USD liability
- Screenshots or leaks void all service access
- Legal action may be pursued for damages
- Criminal penalties may apply for malicious disclosure

5. MENTAL HEALTH ACKNOWLEDGMENT
User understands:
- Content may be psychologically challenging
- Mental health resources are available
- Professional counseling is recommended
- Immediate discontinuation is possible

6. DATA RETENTION
- Shadow Self data deleted 90 days after cancellation
- GDPR/CCPA compliance guaranteed
- Right to request immediate deletion
- No data recovery after deletion

7. GOVERNING LAW
This agreement is governed by the laws of Delaware, USA.

8. ENTIRE AGREEMENT
This NDA constitutes the entire agreement regarding Shadow Self access.

BY SIGNING, USER ACKNOWLEDGES READING, UNDERSTANDING, AND AGREEING TO ALL TERMS.
          `}
                </Text>
            </ScrollView>

            <View style={styles.

                footer}>
                {!scrolledToBottom && (
                    <View style={styles.scrollPrompt}>
                        <Ionicons name="arrow-down" size={20} color="#FF9800" />
                        <Text style={styles.scrollPromptText}>Scroll to bottom to enable signing</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.signButton, !scrolledToBottom && styles.signButtonDisabled]}
                    onPress={signWithBiometric}
                    disabled={!scrolledToBottom || signing}
                >
                    <Ionicons name="finger-print" size={20} color="#FFF" />
                    <Text style={styles.signButtonText}>
                        {signing ? 'Signing...' : 'Sign with Biometric'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.legalNotice}>
                    By signing, you create a legally binding agreement under penalty of perjury
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
        fontSize: 16,
        fontWeight: '600',
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4433620',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F44336',
    },
    warningText: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    ndaContainer: {
        flex: 1,
        padding: 20,
    },
    ndaTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    ndaVersion: {
        color: '#666',
        fontSize: 12,
        marginBottom: 24,
        textAlign: 'center',
    },
    ndaText: {
        color: '#CCC',
        fontSize: 14,
        lineHeight: 22,
    },
    footer: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    scrollPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    scrollPromptText: {
        color: '#FF9800',
        fontSize: 14,
        marginLeft: 8,
    },
    signButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F44336',
        padding: 16,
        borderRadius: 12,
    },
    signButtonDisabled: {
        backgroundColor: '#333',
    },
    signButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    legalNotice: {
        color: '#666',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 12,
    },
});
