import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlatinumSubscriptionScreen({ navigation }: any) {
    const [loading, setLoading] = useState(false);

    const features = [
        {
            icon: 'eye-off',
            title: 'Shadow Self Analysis',
            description: 'Recover and analyze your deleted content',
            color: '#9C27B0',
        },
        {
            icon: 'shield-checkmark',
            title: 'Maximum Privacy',
            description: 'NDA signing, biometric auth, forensic watermarks',
            color: '#F44336',
        },
        {
            icon: 'analytics',
            title: 'Psychological Insights',
            description: 'AI-powered analysis of what you hide from the world',
            color: '#2196F3',
        },
        {
            icon: 'lock-closed',
            title: 'Military-Grade Security',
            description: 'Screenshot detection, access logging, auto-suspend',
            color: '#FF9800',
        },
    ];

    const subscribe = async () => {
        // Navigate to NDA signing
        navigation.navigate('NDASigning');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <View style={styles.platinumBadge}>
                    <Ionicons name="diamond" size={32} color="#FFD700" />
                </View>
                <Text style={styles.heroTitle}>Platinum Tier</Text>
                <Text style={styles.heroSubtitle}>Unlock Your Shadow Self</Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.priceAmount}>$99</Text>
                    <Text style={styles.pricePeriod}>/month</Text>
                </View>
            </View>

            <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>What You Get</Text>
                {features.map((feature, index) => (
                    <View key={index} style={styles.featureCard}>
                        <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                            <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureDescription}>{feature.description}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.warningSection}>
                <Ionicons name="warning" size={24} color="#FF9800" />
                <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>Sensitive Content Warning</Text>
                    <Text style={styles.warningText}>
                        Shadow Self analysis reveals deleted content that you chose to hide. This may include
                        difficult memories, censored thoughts, or private moments. Proceed with caution.
                    </Text>
                </View>
            </View>

            <View style={styles.securitySection}>
                <Text style={styles.sectionTitle}>Security Requirements</Text>
                <View style={styles.securityItem}>
                    <Ionicons name="document-text" size={20} color="#007AFF" />
                    <Text style={styles.securityText}>Sign legally binding NDA</Text>
                </View>
                <View style={styles.securityItem}>
                    <Ionicons name="finger-print" size={20} color="#007AFF" />
                    <Text style={styles.securityText}>Enable biometric authentication</Text>
                </View>
                <View style={styles.securityItem}>
                    <Ionicons name="shield" size={20} color="#007AFF" />
                    <Text style={styles.securityText}>Forensic watermarks on all views</Text>
                </View>
                <View style={styles.securityItem}>
                    <Ionicons name="warning" size={20} color="#F44336" />
                    <Text style={styles.securityText}>Screenshots prohibited - auto-suspend on violations</Text>
                </View>
            </View>

            <View style={styles.liabilitySection}>
                <Text style={styles.liabilityTitle}>Legal Notice</Text>
                <Text style={styles.liabilityText}>
                    By subscribing, you acknowledge that:
                    {'\n'}• Leaked content carries $100,000 liability per violation
                    {'\n'}• Mental health support resources will be provided
                    {'\n'}• This feature is opt-in and can be canceled anytime
                    {'\n'}• GDPR/CCPA compliance: data deleted within 90 days of cancellation
                </Text>
            </View>

            <TouchableOpacity
                style={styles.subscribeButton}
                onPress={subscribe}
                disabled={loading}
            >
                <Ionicons name="diamond" size={20} color="#FFF" />
                <Text style={styles.subscribeButtonText}>
                    {loading ? 'Processing...' : 'Subscribe to Platinum - $99/mo'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.cancelNote}>Cancel anytime. No hidden fees.</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: 16,
        alignItems: 'flex-end',
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    platinumBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFD70020',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        color: '#FFD700',
        fontSize: 32,
        fontWeight: 'bold',
    },
    heroSubtitle: {
        color: '#999',
        fontSize: 18,
        marginTop: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 24,
    },
    priceAmount: {
        color: '#FFF',
        fontSize: 56,
        fontWeight: 'bold',
    },
    pricePeriod: {
        color: '#666',
        fontSize: 20,
        marginLeft: 8,
    },
    featuresSection: {
        padding: 16,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    featureCard: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureContent: {
        flex: 1,
        marginLeft: 16,
    },
    featureTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureDescription: {
        color: '#999',
        fontSize: 14,
    },
    warningSection: {
        flexDirection: 'row',
        backgroundColor: '#FF980020',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    warningContent: {
        flex: 1,
        marginLeft: 12,
    },
    warningTitle: {
        color: '#FF9800',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    warningText: {
        color: '#FF9800',
        fontSize: 14,
        lineHeight: 20,
    },
    securitySection: {
        padding: 16,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    securityText: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 12,
    },
    liabilitySection: {
        backgroundColor: '#F4433620',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
    },
    liabilityTitle: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    liabilityText: {
        color: '#F44336',
        fontSize: 14,
        lineHeight: 22,
    },
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFD700',
        margin: 16,
        padding: 18,
        borderRadius: 12,
    },
    subscribeButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    cancelNote: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 32,
    },
});
