import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen({ navigation }: any) {
    const { user, logout } = useAuth();
    const isCreator = user?.role === 'CREATOR';

    // Mock stats
    const stats = isCreator
        ? [
            { label: 'Subscribers', value: '0' },
            { label: 'Chapters', value: '0' },
            { label: 'Views', value: '0' },
        ]
        : [
            { label: 'Following', value: '0' },
            { label: 'Subscriptions', value: '0' },
            { label: 'Bookmarks', value: '0' },
        ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={isCreator ? ['#f093fb', '#f5576c'] : ['#4facfe', '#00f2fe']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Text style={styles.settingsIcon}>⚙️</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton}>
                            <Text style={styles.editAvatarText}>📷</Text>
                        </TouchableOpacity>
                    </View>

                    {/* User Info */}
                    <Text style={styles.name}>
                        {user?.displayName || `${user?.firstName} ${user?.lastName}`}
                    </Text>
                    <Text style={styles.email}>{user?.email}</Text>

                    {/* Role Badge */}
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleIcon}>{isCreator ? '✍️' : '👁️'}</Text>
                        <Text style={styles.roleText}>
                            {isCreator ? 'Creator Account' : 'Consumer Account'}
                        </Text>
                    </View>

                    {/* Bio */}
                    {user?.bio && (
                        <Text style={styles.bio}>{user.bio}</Text>
                    )}

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        {stats.map((stat, index) => (
                            <View key={index} style={styles.statCard}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsCard}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionIcon}>✏️</Text>
                            <Text style={styles.actionText}>Edit Profile</Text>
                            <Text style={styles.actionArrow}>→</Text>
                        </TouchableOpacity>

                        {isCreator && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('BiographyGeneration')}
                            >
                                <Text style={styles.actionIcon}>📖</Text>
                                <Text style={styles.actionText}>My Biography</Text>
                                <Text style={styles.actionArrow}>→</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionIcon}>📊</Text>
                            <Text style={styles.actionText}>Analytics</Text>
                            <Text style={styles.actionArrow}>→</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('DataSources')}
                        >
                            <Text style={styles.actionIcon}>🔗</Text>
                            <Text style={styles.actionText}>Connected Data</Text>
                            <Text style={styles.actionArrow}>→</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsIcon: {
        fontSize: 20,
    },
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFF',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#f093fb',
    },
    editAvatarText: {
        fontSize: 18,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 16,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'center',
        marginBottom: 16,
    },
    roleIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    bio: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 20,
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
    actionsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 8,
        marginBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    actionArrow: {
        fontSize: 20,
        color: '#999',
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
