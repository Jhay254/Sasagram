import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function FollowerListScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { userId, type } = route.params; // type: 'followers' or 'following'
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const endpoint = type === 'followers' ? 'followers' : 'following';
            // const response = await fetch(`/api/follow/users/${userId}/${endpoint}`);
            // const data = await response.json();
            // setUsers(data.data);

            // Mock data
            setUsers([
                {
                    id: '1',
                    firstName: 'Mike',
                    lastName: 'Chen',
                    displayName: '@mikec',
                    avatarUrl: null,
                    role: 'CREATOR',
                    isVerified: false,
                    followerCount: 856,
                },
                {
                    id: '2',
                    firstName: 'Emma',
                    lastName: 'Davis',
                    displayName: '@emmad',
                    avatarUrl: null,
                    role: 'CREATOR',
                    isVerified: true,
                    followerCount: 2341,
                },
            ]);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderUser = ({ item }: any) => (
        <TouchableOpacity
            style={[styles.userCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}
        >
            <View style={[styles.avatar, { backgroundColor: theme.colors.border }]}>
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <Ionicons name="person" size={28} color={theme.colors.textSecondary} />
                )}
            </View>

            <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                        {item.firstName} {item.lastName}
                    </Text>
                    {item.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                    )}
                </View>
                <Text style={[styles.displayName, { color: theme.colors.textSecondary }]}>
                    {item.displayName}
                </Text>
                <Text style={[styles.followers, { color: theme.colors.textSecondary }]}>
                    {item.followerCount.toLocaleString()} followers
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.followButton, { backgroundColor: theme.colors.primary }]}
            >
                <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    {type === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    userInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    displayName: {
        fontSize: 14,
        marginBottom: 2,
    },
    followers: {
        fontSize: 13,
    },
    followButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    followButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
