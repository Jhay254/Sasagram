import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }: any) {
    const { user, logout } = useAuth();

    const isCreator = user?.role === 'CREATOR';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={isCreator ? ['#f093fb', '#f5576c'] : ['#4facfe', '#00f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.userName}>{user?.displayName || user?.firstName}!</Text>
                        </View>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Role Badge */}
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleIcon}>{isCreator ? '✍️' : '👁️'}</Text>
                        <Text style={styles.roleText}>{isCreator ? 'Creator Account' : 'Consumer Account'}</Text>
                    </View>

                    {/* Quick Stats (Placeholder) */}
                    <View style={styles.statsContainer}>
                        {isCreator ? (
                            <>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>0</Text>
                                    <Text style={styles.statLabel}>Subscribers</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>$0</Text>
                                    <Text style={styles.statLabel}>Monthly Revenue</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>0</Text>
                                    <Text style={styles.statLabel}>Chapters</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>0</Text>
                                    <Text style={styles.statLabel}>Following</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>0</Text>
                                    <Text style={styles.statLabel}>Subscriptions</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Text style={styles.statValue}>0</Text>
                                    <Text style={styles.statLabel}>Bookmarks</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Data Sources Card */}
                    <TouchableOpacity
                        style={styles.dataSourcesCard}
                        onPress={() => navigation.navigate('DataSources')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.dataSourcesHeader}>
                            <Text style={styles.dataSourcesIcon}>🔗</Text>
                            <View style={styles.dataSourcesInfo}>
                                <Text style={styles.dataSourcesTitle}>Connect Your Data</Text>
                                <Text style={styles.dataSourcesText}>
                                    {isCreator
                                        ? 'Link your social media and email to generate your biography'
                                        : 'Connect accounts to enhance your experience'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status:</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>
                                    {user?.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Member since:</Text>
                            <Text style={styles.infoValue}>
                                {new Date().toLocaleDateString()}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {/* Coming Soon Message */}
                    <View style={styles.comingSoonCard}>
                        <Text style={styles.comingSoonIcon}>🚀</Text>
                        <Text style={styles.comingSoonTitle}>More Features Coming Soon!</Text>
                        <Text style={styles.comingSoonText}>
                            {isCreator
                                ? 'Biography generation, data integration, monetization tools, and more...'
                                : 'Discover creators, subscribe to stories, explore the Memory Graph, and more...'}
                        </Text>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    userName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    roleIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    roleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    dataSourcesCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    dataSourcesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dataSourcesIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    dataSourcesInfo: {
        flex: 1,
    },
    dataSourcesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    dataSourcesText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
    },
    statusBadge: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
    },
    comingSoonCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    comingSoonIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    comingSoonTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    comingSoonText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 20,
    },
    logoutButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
