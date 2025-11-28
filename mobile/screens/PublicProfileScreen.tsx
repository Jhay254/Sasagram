import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

export default function PublicProfileScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { userId } = route.params;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch(`/api/follow/users/${userId}/profile`);
            // const data = await response.json();
            // setProfile(data.data);
            // setFollowing(data.data.isFollowing);

            // Mock data
            setProfile({
                id: userId,
                firstName: 'Sarah',
                lastName: 'Johnson',
                displayName: '@sarahj',
                avatarUrl: null,
                bio: 'Tech entrepreneur & world traveler sharing life stories',
                location: 'San Francisco, CA',
                website: 'https://sarahj.com',
                role: 'CREATOR',
                isVerified: true,
                followerCount: 12453,
                followingCount: 342,
                memoryCompleteness: 87.5,
                createdAt: new Date('2024-01-15'),
                biographies: [
                    {
                        id: '1',
                        title: 'My Startup Journey',
                        coverImageUrl: null,
                        viewCount: 8543,
                        createdAt: new Date('2024-10-01'),
                    },
                    {
                        id: '2',
                        title: 'Travels Through Asia',
                        coverImageUrl: null,
                        viewCount: 6721,
                        createdAt: new Date('2024-09-15'),
                    },
                ],
            });
            setFollowing(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            // TODO: Call API
            // await fetch(`/api/follow/users/${userId}/follow`, { method: 'POST' });
            setFollowing(true);
            setProfile((prev: any) => ({ ...prev, followerCount: prev.followerCount + 1 }));
        } catch (error) {
            console.error('Error following:', error);
        }
    };

    const handleUnfollow = async () => {
        try {
            // TODO: Call API
            // await fetch(`/api/follow/users/${userId}/unfollow`, { method: 'POST' });
            setFollowing(false);
            setProfile((prev: any) => ({ ...prev, followerCount: prev.followerCount - 1 }));
        } catch (error) {
            console.error('Error unfollowing:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.errorText, { color: theme.colors.text }]}>
                    Profile not found
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton}>
                    <Ionicons name="share-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.profileSection}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.border }]}>
                    {profile.avatarUrl ? (
                        <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
                    ) : (
                        <Ionicons name="person" size={48} color={theme.colors.textSecondary} />
                    )}
                </View>

                <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.colors.text }]}>
                        {profile.firstName} {profile.lastName}
                    </Text>
                    {profile.isVerified && (
                        <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                    )}
                </View>

                <Text style={[styles.displayName, { color: theme.colors.textSecondary }]}>
                    {profile.displayName}
                </Text>

                <View style={styles.stats}>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => navigation.navigate('FollowerList', { userId, type: 'followers' })}
                    >
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                            {profile.followerCount.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                            Followers
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => navigation.navigate('FollowerList', { userId, type: 'following' })}
                    >
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                            {profile.followingCount.toLocaleString()}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                            Following
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                            {profile.memoryCompleteness.toFixed(0)}%
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                            Completeness
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.followButton,
                        {
                            backgroundColor: following ? theme.colors.surface : theme.colors.primary,
                            borderColor: theme.colors.primary,
                            borderWidth: following ? 1 : 0,
                        },
                    ]}
                    onPress={following ? handleUnfollow : handleFollow}
                >
                    <Text
                        style={[
                            styles.followButtonText,
                            { color: following ? theme.colors.text : '#FFF' },
                        ]}
                    >
                        {following ? 'Following' : 'Follow'}
                    </Text>
                </TouchableOpacity>

                {profile.bio && (
                    <Text style={[styles.bio, { color: theme.colors.text }]}>
                        {profile.bio}
                    </Text>
                )}

                {profile.location && (
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            {profile.location}
                        </Text>
                    </View>
                )}

                {profile.website && (
                    <View style={styles.infoRow}>
                        <Ionicons name="link-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.colors.primary }]}>
                            {profile.website}
                        </Text>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                        Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
                    </Text>
                </View>
            </View>

            <View style={styles.biographiesSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Biographies
                </Text>
                {profile.biographies.map((bio: any) => (
                    <TouchableOpacity
                        key={bio.id}
                        style={[styles.bioCard, { backgroundColor: theme.colors.surface }]}
                    >
                        <View style={[styles.bioCover, { backgroundColor: theme.colors.border }]}>
                            {bio.coverImageUrl ? (
                                <Image source={{ uri: bio.coverImageUrl }} style={styles.bioCoverImage} />
                            ) : (
                                <Ionicons name="book-outline" size={32} color={theme.colors.textSecondary} />
                            )}
                        </View>
                        <View style={styles.bioInfo}>
                            <Text style={[styles.bioTitle, { color: theme.colors.text }]}>
                                {bio.title}
                            </Text>
                            <Text style={[styles.bioViews, { color: theme.colors.textSecondary }]}>
                                {bio.viewCount.toLocaleString()} views
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 120,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 4,
    },
    shareButton: {
        padding: 4,
    },
    profileSection: {
        padding: 24,
        marginTop: -40,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        marginBottom: 16,
    },
    avatarImage: {
        width: 92,
        height: 92,
        borderRadius: 46,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    displayName: {
        fontSize: 16,
        marginBottom: 16,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
    },
    followButton: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    followButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bio: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
    },
    biographiesSection: {
        padding: 24,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    bioCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    bioCover: {
        width: 80,
        height: 80,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bioCoverImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    bioInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    bioTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    bioViews: {
        fontSize: 14,
    },
    errorText: {
        fontSize: 18,
        textAlign: 'center',
    },
});
