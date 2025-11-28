import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Organization {
    id: string;
    companyName: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    maxUsers: number;
    currentUsers: number;
    trialEndsAt?: string;
    autoUpgrade: boolean;
}

interface DashboardStats {
    totalTimeline: number;
    publicEvents: number;
    integrations: number;
    activeMembers: number;
}

export default function OrganizationDashboardScreen({ navigation, route }: any) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            // Fetch organization details
            const orgResponse = await axios.get('/api/organization/current');
            setOrganization(orgResponse.data);

            // Fetch dashboard stats
            const statsResponse = await axios.get('/api/organization/stats');
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            STARTER: '#3B82F6',
            PROFESSIONAL: '#8B5CF6',
            ENTERPRISE: '#F59E0B',
            ENTERPRISE_PLUS: '#EF4444',
        };
        return colors[tier] || '#6B7280';
    };

    const getTierLabel = (tier: string) => {
        return tier.replace('_', ' ');
    };

    const getStatusColor = (status: string) => {
        if (status === 'TRIAL') return '#F59E0B';
        if (status === 'ACTIVE') return '#10B981';
        if (status === 'SUSPENDED') return '#EF4444';
        return '#6B7280';
    };

    const isNearLimit = organization && organization.currentUsers >= organization.maxUsers * 0.8;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!organization) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="business-outline" size={64} color="#9CA3AF" />
                <Text style={styles.errorText}>No organization found</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateOrganization')}
                >
                    <Text style={styles.createButtonText}>Create Organization</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Organization Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.companyName}>{organization.companyName}</Text>
                    <View style={[styles.tierBadge, { backgroundColor: getTierColor(organization.subscriptionTier) }]}>
                        <Text style={styles.tierText}>{getTierLabel(organization.subscriptionTier)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('OrganizationSettings')}
                >
                    <Ionicons name="settings-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Status Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Subscription Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(organization.subscriptionStatus) }]}>
                        <Text style={styles.statusText}>{organization.subscriptionStatus}</Text>
                    </View>
                </View>

                {organization.subscriptionStatus === 'TRIAL' && organization.trialEndsAt && (
                    <View style={styles.trialWarning}>
                        <Ionicons name="time-outline" size={20} color="#F59E0B" />
                        <Text style={styles.trialText}>
                            Trial ends {new Date(organization.trialEndsAt).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            {/* User Limit Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Team Members</Text>
                    <Text style={styles.userCount}>
                        {organization.currentUsers} / {organization.maxUsers}
                    </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${(organization.currentUsers / organization.maxUsers) * 100}%`,
                                backgroundColor: isNearLimit ? '#F59E0B' : '#10B981',
                            },
                        ]}
                    />
                </View>

                {isNearLimit && (
                    <View style={styles.warningBanner}>
                        <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                        <Text style={styles.warningText}>Approaching user limit</Text>
                        {organization.autoUpgrade && (
                            <Text style={styles.autoUpgradeText}>Auto-upgrade enabled ✓</Text>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() => navigation.navigate('InviteMembers')}
                >
                    <Ionicons name="person-add-outline" size={20} color="#6366F1" />
                    <Text style={styles.inviteButtonText}>Invite Members</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            {stats && (
                <View style={styles.statsGrid}>
                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('CompanyTimeline')}
                    >
                        <Ionicons name="calendar-outline" size={32} color="#6366F1" />
                        <Text style={styles.statValue}>{stats.totalTimeline}</Text>
                        <Text style={styles.statLabel}>Timeline Events</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('CorporateIntegrations')}
                    >
                        <Ionicons name="link-outline" size={32} color="#8B5CF6" />
                        <Text style={styles.statValue}>{stats.integrations}</Text>
                        <Text style={styles.statLabel}>Integrations</Text>
                    </TouchableOpacity>

                    <View style={styles.statCard}>
                        <Ionicons name="globe-outline" size={32} color="#10B981" />
                        <Text style={styles.statValue}>{stats.publicEvents}</Text>
                        <Text style={styles.statLabel}>Public Events</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.statCard}
                        onPress={() => navigation.navigate('TeamMembers')}
                    >
                        <Ionicons name="people-outline" size={32} color="#F59E0B" />
                        <Text style={styles.statValue}>{stats.activeMembers}</Text>
                        <Text style={styles.statLabel}>Active Members</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CompanyTimeline')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#6366F1" />
                    <Text style={styles.actionButtonText}>Add Timeline Event</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('CorporateIntegrations')}
                >
                    <Ionicons name="link" size={24} color="#8B5CF6" />
                    <Text style={styles.actionButtonText}>Connect Integration</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('RecruitingShowcase')}
                >
                    <Ionicons name="briefcase-outline" size={24} color="#10B981" />
                    <Text style={styles.actionButtonText}>View Recruiting Page</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
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
        backgroundColor: '#F9FAFB',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerContent: {
        flex: 1,
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    tierBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tierText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    settingsButton: {
        padding: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    trialWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    trialText: {
        marginLeft: 8,
        color: '#92400E',
        fontSize: 14,
    },
    userCount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginVertical: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    warningText: {
        marginLeft: 8,
        color: '#92400E',
        fontSize: 13,
        flex: 1,
    },
    autoUpgradeText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '600',
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    inviteButtonText: {
        marginLeft: 8,
        color: '#6366F1',
        fontSize: 15,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        margin: 8,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    actionButtonText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
    },
});
