import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Badge {
    id: string;
    level: string;
    category: string;
    earnedBy: string;
    earnedAt: string;
    verificationCount: number;
    deepfakeScore: number;
}

interface Progress {
    currentLevel: string | null;
    nextLevel: string | null;
    progress: number;
    requirements: any;
}

export default function TrustBadgeScreen({ navigation }: any) {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [criteria, setCriteria] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        loadAuthData();
    }, []);

    useEffect(() => {
        if (userId && token) {
            loadBadges();
            loadProgress();
            loadCriteria();
        }
    }, [userId, token]);

    const loadAuthData = async () => {
        try {
            const [storedUserId, storedToken] = await Promise.all([
                AsyncStorage.getItem('userId'),
                AsyncStorage.getItem('token'),
            ]);
            setUserId(storedUserId);
            setToken(storedToken);
        } catch (error) {
            console.error('Error loading auth data:', error);
        }
    };

    const loadBadges = async () => {
        try {
            const response = await fetch(`/api/trust-badges/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setBadges(data.badges);
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    };

    const loadProgress = async () => {
        try {
            const response = await fetch('/api/trust-badges/progress', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setProgress(data);
        } catch (error) {
            console.error('Error loading progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCriteria = async () => {
        try {
            const response = await fetch('/api/trust-badges/criteria');
            const data = await response.json();
            setCriteria(data);
        } catch (error) {
            console.error('Error loading criteria:', error);
        }
    };

    const getBadgeColor = (level: string) => {
        const colors: Record<string, string> = {
            BRONZE: '#CD7F32',
            SILVER: '#C0C0C0',
            GOLD: '#FFD700',
            PLATINUM: '#E5E4E2',
        };
        return colors[level] || '#666';
    };

    const getBadgeIcon = (level: string) => {
        const icons: Record<string, string> = {
            BRONZE: 'medal',
            SILVER: 'ribbon',
            GOLD: 'trophy',
            PLATINUM: 'diamond',
        };
        return icons[level] || 'medal';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Trust Badges</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Current Badges */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Badges</Text>
                    {badges.length === 0 ? (
                        <View style={styles.noBadges}>
                            <Ionicons name="medal-outline" size={48} color="#666" />
                            <Text style={styles.noBadgesText}>No badges earned yet</Text>
                            <Text style={styles.noBadgesSubtext}>
                                Verify content on blockchain to start earning badges
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.badgesGrid}>
                            {badges.map((badge) => (
                                <View key={badge.id} style={styles.badgeCard}>
                                    <View
                                        style={[
                                            styles.badgeIcon,
                                            { backgroundColor: getBadgeColor(badge.level) + '20' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getBadgeIcon(badge.level) as any}
                                            size={32}
                                            color={getBadgeColor(badge.level)}
                                        />
                                    </View>
                                    <Text style={styles.badgeLevel}>{badge.level}</Text>
                                    <Text style={styles.badgeCategory}>{badge.category}</Text>
                                    <Text style={styles.badgeCount}>{badge.verificationCount} verified</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Progress to Next Level */}
                {progress && progress.nextLevel && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Progress to {progress.nextLevel}</Text>
                        <View style={styles.progressCard}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressText}>{progress.progress}% Complete</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
                            </View>

                            {progress.requirements?.verifiedItems && (
                                <View style={styles.requirement}>
                                    <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
                                    <View style={styles.requirementText}>
                                        <Text style={styles.requirementLabel}>Verified Items</Text>
                                        <Text style={styles.requirementValue}>
                                            {progress.requirements.verifiedItems.current} /{' '}
                                            {progress.requirements.verifiedItems.required}
                                        </Text>
                                    </View>
                                    <Text style={styles.requirementProgress}>
                                        {Math.round(progress.requirements.verifiedItems.progress)}%
                                    </Text>
                                </View>
                            )}

                            {progress.requirements?.authenticityScore && (
                                <View style={styles.requirement}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                    <View style={styles.requirementText}>
                                        <Text style={styles.requirementLabel}>Authenticity Score</Text>
                                        <Text style={styles.requirementValue}>
                                            {(progress.requirements.authenticityScore.current * 100).toFixed(1)}% /{' '}
                                            {(progress.requirements.authenticityScore.required * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                    <Text style={styles.requirementProgress}>
                                        {Math.round(progress.requirements.authenticityScore.progress)}%
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Badge Criteria */}
                {criteria && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Badge Requirements</Text>
                        {Object.values(criteria).map((item: any) => (
                            <View key={item.level} style={styles.criteriaCard}>
                                <View style={styles.criteriaHeader}>
                                    <View
                                        style={[
                                            styles.criteriaIcon,
                                            { backgroundColor: getBadgeColor(item.level) + '20' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getBadgeIcon(item.level) as any}
                                            size={24}
                                            color={getBadgeColor(item.level)}
                                        />
                                    </View>
                                    <Text style={[styles.criteriaLevel, { color: getBadgeColor(item.level) }]}>
                                        {item.level}
                                    </Text>
                                </View>
                                <Text style={styles.criteriaDescription}>{item.description}</Text>
                                <View style={styles.criteriaBenefits}>
                                    {item.benefits.map((benefit: string, idx: number) => (
                                        <View key={idx} style={styles.benefitRow}>
                                            <Ionicons name="checkmark" size={16} color="#4CAF50" />
                                            <Text style={styles.benefitText}>{benefit}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    noBadges: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    noBadgesText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    noBadgesSubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    badgeCard: {
        width: '48%',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    badgeIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeLevel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    badgeCategory: {
        color: '#666',
        fontSize: 12,
        marginBottom: 8,
    },
    badgeCount: {
        color: '#007AFF',
        fontSize: 12,
    },
    progressCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
    },
    progressHeader: {
        marginBottom: 12,
    },
    progressText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    requirementText: {
        flex: 1,
        marginLeft: 12,
    },
    requirementLabel: {
        color: '#999',
        fontSize: 12,
    },
    requirementValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    requirementProgress: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    criteriaCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    criteriaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    criteriaIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    criteriaLevel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    criteriaDescription: {
        color: '#999',
        fontSize: 14,
        marginBottom: 12,
    },
    criteriaBenefits: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 12,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    benefitText: {
        color: '#CCC',
        fontSize: 14,
        marginLeft: 8,
    },
});
