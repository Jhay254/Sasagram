import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import ReferralShareModal from '../components/ReferralShareModal';

export default function ReferralDashboardScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [stats, setStats] = useState<any>(null);
    const [referralCode, setReferralCode] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            // TODO: Call APIs
            // const codeRes = await fetch('/api/referral/code');
            // const statsRes = await fetch('/api/referral/stats');

            // Mock data
            setReferralCode('SARAH2024');
            setStats({
                totalReferrals: 12,
                successfulReferrals: 8,
                pendingReferrals: 4,
                totalEarnings: 240,
                nextMilestone: {
                    referralsNeeded: 2,
                    reward: 50,
                    title: '10 Referrals',
                },
            });
        } catch (error) {
            console.error('Error fetching referral data:', error);
        }
    };

    const handleShare = async () => {
        const referralUrl = `https://lifeline.app?ref=${referralCode}`;
        const message = `Join me on Lifeline and get $10 off! Use my code: ${referralCode}\n${referralUrl}`;

        try {
            await Share.share({
                message,
                title: 'Join Lifeline',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const copyToClipboard = () => {
        // TODO: Implement clipboard
        Alert.alert('Copied!', 'Referral code copied to clipboard');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Referral Program</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ReferralLeaderboard')}>
                    <Ionicons name="trophy" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.content}>
                {/* Referral Code Card */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                        Your Referral Code
                    </Text>
                    <View style={styles.codeContainer}>
                        <Text style={[styles.code, { color: theme.colors.primary }]}>
                            {referralCode}
                        </Text>
                        <TouchableOpacity
                            style={[styles.copyButton, { backgroundColor: theme.colors.primary }]}
                            onPress={copyToClipboard}
                        >
                            <Ionicons name="copy" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.shareButton, { borderColor: theme.colors.primary }]}
                        onPress={() => setShowShareModal(true)}
                    >
                        <Ionicons name="share-social" size={20} color={theme.colors.primary} />
                        <Text style={[styles.shareButtonText, { color: theme.colors.primary }]}>
                            Share with Friends
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="people" size={32} color={theme.colors.primary} />
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                            {stats?.totalReferrals || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                            Total Referrals
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                            {stats?.successfulReferrals || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                            Successful
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="cash" size={32} color="#f59e0b" />
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                            ${stats?.totalEarnings || 0}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                            Earned
                        </Text>
                    </View>
                </View>

                {/* Next Milestone */}
                {stats?.nextMilestone && (
                    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.milestoneHeader}>
                            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                Next Milestone
                            </Text>
                            <Ionicons name="trophy" size={24} color="#f59e0b" />
                        </View>
                        <Text style={[styles.milestoneTitle, { color: theme.colors.text }]}>
                            {stats.nextMilestone.title}
                        </Text>
                        <Text style={[styles.milestoneDescription, { color: theme.colors.textSecondary }]}>
                            {stats.nextMilestone.referralsNeeded} more referral
                            {stats.nextMilestone.referralsNeeded !== 1 ? 's' : ''} to unlock ${stats.nextMilestone.reward}
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            backgroundColor: theme.colors.primary,
                                            width: `${((stats.successfulReferrals || 0) / 10) * 100}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                                {stats.successfulReferrals}/10
                            </Text>
                        </View>
                    </View>
                )}

                {/* How It Works */}
                <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                        How It Works
                    </Text>
                    <View style={styles.stepsList}>
                        <View style={styles.step}>
                            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.colors.text }]}>
                                Share your unique referral code
                            </Text>
                        </View>
                        <View style={styles.step}>
                            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.colors.text }]}>
                                Friend signs up using your code
                            </Text>
                        </View>
                        <View style={styles.step}>
                            <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={[styles.stepText, { color: theme.colors.text }]}>
                                You both earn rewards!
                            </Text>
                        </View>
                    </View>
                </View>

                {/* View History Button */}
                <TouchableOpacity
                    style={[styles.historyButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.navigate('ReferralHistory')}
                >
                    <Text style={[styles.historyButtonText, { color: theme.colors.text }]}>
                        View Referral History
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ReferralShareModal
                visible={showShareModal}
                onClose={() => setShowShareModal(false)}
                referralCode={referralCode}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    code: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    copyButton: {
        padding: 12,
        borderRadius: 8,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    milestoneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    milestoneTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    milestoneDescription: {
        fontSize: 14,
        marginBottom: 16,
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepsList: {
        gap: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    historyButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
