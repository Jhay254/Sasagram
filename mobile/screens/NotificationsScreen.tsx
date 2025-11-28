import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

export default function NotificationsScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch('/api/notifications');
            // const data = await response.json();
            // setNotifications(data.data);

            // Mock data
            setNotifications([
                {
                    id: '1',
                    type: 'TAG_RECEIVED',
                    title: 'New Tag',
                    message: 'Sarah Johnson tagged you in "Brooklyn Concert"',
                    read: false,
                    createdAt: new Date(),
                    data: { biographyId: 'abc123' },
                },
                {
                    id: '2',
                    type: 'NEW_FOLLOWER',
                    title: 'New Follower',
                    message: 'Mike Chen started following you',
                    read: false,
                    createdAt: new Date(Date.now() - 3600000),
                    data: { userId: 'user123' },
                },
                {
                    id: '3',
                    type: 'NEW_REVIEW',
                    title: 'New Review',
                    message: 'Emma Davis reviewed your biography',
                    read: true,
                    createdAt: new Date(Date.now() - 86400000),
                    data: { biographyId: 'bio456' },
                },
            ]);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            // TODO: Call API
            // await fetch('/api/notifications/read-all', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationTap = async (notification: any) => {
        // Mark as read
        try {
            // TODO: Call API
            // await fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' });
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }

        // Navigate based on type
        if (notification.data?.biographyId) {
            navigation.navigate('BiographyViewer', {
                biographyId: notification.data.biographyId,
            });
        } else if (notification.data?.userId) {
            navigation.navigate('PublicProfile', { userId: notification.data.userId });
        }
    };

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, string> = {
            TAG_RECEIVED: 'pricetag',
            TAG_VERIFIED: 'checkmark-circle',
            NEW_FOLLOWER: 'person-add',
            NEW_REVIEW: 'star',
            CHAPTER_REACTION: 'heart',
            MEMORY_COLLISION: 'git-merge',
            MILESTONE_ACHIEVED: 'trophy',
            REFERRAL_SIGNUP: 'gift',
        };
        return icons[type] || 'notifications';
    };

    const getNotificationColor = (type: string) => {
        const colors: Record<string, string> = {
            TAG_RECEIVED: '#667eea',
            TAG_VERIFIED: '#10b981',
            NEW_FOLLOWER: '#3b82f6',
            NEW_REVIEW: '#f59e0b',
            CHAPTER_REACTION: '#ec4899',
            MEMORY_COLLISION: '#8b5cf6',
            MILESTONE_ACHIEVED: '#f59e0b',
            REFERRAL_SIGNUP: '#10b981',
        };
        return colors[type] || theme.colors.primary;
    };

    const renderNotification = ({ item }: any) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                {
                    backgroundColor: item.read
                        ? theme.colors.background
                        : theme.colors.surface,
                },
            ]}
            onPress={() => handleNotificationTap(item)}
        >
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: getNotificationColor(item.type) + '20' },
                ]}
            >
                <Ionicons
                    name={getNotificationIcon(item.type) as any}
                    size={24}
                    color={getNotificationColor(item.type)}
                />
            </View>

            <View style={styles.notificationContent}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                    {item.title}
                </Text>
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                    {item.message}
                </Text>
                <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                    {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                </Text>
            </View>

            {!item.read && (
                <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
            )}
        </TouchableOpacity>
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            {unreadCount > 0 && (
                <View style={[styles.markAllContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.unreadText, { color: theme.colors.text }]}>
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity onPress={handleMarkAllRead}>
                        <Text style={[styles.markAllButton, { color: theme.colors.primary }]}>
                            Mark all as read
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={item => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No notifications
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                        You're all caught up!
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    markAllContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    unreadText: {
        fontSize: 14,
        fontWeight: '600',
    },
    markAllButton: {
        fontSize: 14,
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
    },
});
