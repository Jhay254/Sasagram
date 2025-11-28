import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    EmailVerification: { email: string };
};

type EmailVerificationScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'EmailVerification'>;
    route: RouteProp<RootStackParamList, 'EmailVerification'>;
};

export default function EmailVerificationScreen({
    navigation,
    route,
}: EmailVerificationScreenProps) {
    const { email } = route.params;
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            Alert.alert('Error', 'Please enter the 6-digit verification code');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            Alert.alert(
                'Success!',
                'Your email has been verified. You can now log in.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            Alert.alert('Verification Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const response = await fetch('http://localhost:3000/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to resend code');
            }

            Alert.alert('Success', 'Verification code sent to your email');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.icon}>✉️</Text>
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to:
                        </Text>
                        <Text style={styles.emailText}>{email}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.codeInputContainer}>
                            <TextInput
                                style={styles.codeInput}
                                placeholder="000000"
                                placeholderTextColor="#999"
                                value={code}
                                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerify}
                            disabled={loading || code.length !== 6}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#667eea" />
                            ) : (
                                <Text style={styles.buttonText}>Verify Email</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive the code? </Text>
                            <TouchableOpacity onPress={handleResend} disabled={resending}>
                                <Text style={[styles.resendLink, resending && styles.resendDisabled]}>
                                    {resending ? 'Sending...' : 'Resend'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    backButtonText: {
        fontSize: 24,
        color: '#FFF',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    icon: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 8,
    },
    emailText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    formContainer: {
        flex: 1,
    },
    codeInputContainer: {
        marginBottom: 32,
    },
    codeInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 20,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        letterSpacing: 8,
    },
    button: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    resendText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 15,
    },
    resendLink: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    resendDisabled: {
        opacity: 0.5,
    },
});
