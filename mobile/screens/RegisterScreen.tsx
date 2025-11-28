import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    Home: undefined;
};

type RegisterScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
    const { register } = useAuth();
    const [step, setStep] = useState(1); // 1: Role selection, 2: Account details
    const [role, setRole] = useState<'CREATOR' | 'CONSUMER' | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRoleSelection = (selectedRole: 'CREATOR' | 'CONSUMER') => {
        setRole(selectedRole);
        setStep(2);
    };

    const handleRegister = async () => {
        if (!email || !password || !firstName || !role) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register(email.toLowerCase().trim(), password, role, firstName, lastName);
            Alert.alert(
                'Success!',
                'Registration successful! Please check your email to verify your account.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const renderRoleSelection = () => (
        <View style={styles.roleContainer}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Choose Your Path</Text>
                <Text style={styles.subtitle}>How do you want to use Lifeline?</Text>
            </View>

            <View style={styles.roleCards}>
                <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => handleRoleSelection('CREATOR')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#f093fb', '#f5576c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.roleCardGradient}
                    >
                        <Text style={styles.roleIcon}>✍️</Text>
                        <Text style={styles.roleTitle}>Creator</Text>
                        <Text style={styles.roleDescription}>
                            Transform your life into a monetizable story. Share your journey and earn from your narrative.
                        </Text>
                        <View style={styles.roleFeatures}>
                            <Text style={styles.roleFeature}>✓ AI Biography Generation</Text>
                            <Text style={styles.roleFeature}>✓ Monetize Your Story</Text>
                            <Text style={styles.roleFeature}>✓ Build Your Audience</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.roleCard}
                    onPress={() => handleRoleSelection('CONSUMER')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#4facfe', '#00f2fe']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.roleCardGradient}
                    >
                        <Text style={styles.roleIcon}>👁️</Text>
                        <Text style={styles.roleTitle}>Consumer</Text>
                        <Text style={styles.roleDescription}>
                            Discover and follow the deep, authentic stories of creators you admire.
                        </Text>
                        <View style={styles.roleFeatures}>
                            <Text style={styles.roleFeature}>✓ Exclusive Content Access</Text>
                            <Text style={styles.roleFeature}>✓ Behind-the-Scenes Stories</Text>
                            <Text style={styles.roleFeature}>✓ Connect with Creators</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderAccountForm = () => (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                    You're joining as a {role === 'CREATOR' ? '✍️ Creator' : '👁️ Consumer'}
                </Text>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>First Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John"
                            placeholderTextColor="#999"
                            value={firstName}
                            onChangeText={setFirstName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Doe"
                            placeholderTextColor="#999"
                            value={lastName}
                            onChangeText={setLastName}
                            autoCapitalize="words"
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password * (min 8 characters)</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Create a strong password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor="#999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#667eea" />
                    ) : (
                        <Text style={styles.registerButtonText}>Create Account</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                        By signing up, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                </View>

                <View style={styles.loginPrompt}>
                    <Text style={styles.loginPromptText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {step === 1 ? renderRoleSelection() : renderAccountForm()}
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    roleContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
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
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    roleCards: {
        flex: 1,
        justifyContent: 'center',
        gap: 20,
    },
    roleCard: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    roleCardGradient: {
        padding: 24,
    },
    roleIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    roleTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    roleDescription: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
        marginBottom: 20,
    },
    roleFeatures: {
        gap: 8,
    },
    roleFeature: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '500',
    },
    formContainer: {
        flex: 1,
    },
    inputRow: {
        flexDirection: 'row',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        paddingHorizontal: 16,
    },
    eyeText: {
        fontSize: 20,
    },
    registerButton: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    registerButtonText: {
        color: '#667eea',
        fontSize: 18,
        fontWeight: 'bold',
    },
    termsContainer: {
        marginBottom: 24,
    },
    termsText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 20,
    },
    termsLink: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    loginPrompt: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginPromptText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 15,
    },
    loginLink: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
