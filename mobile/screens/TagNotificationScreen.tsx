import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';

export default function TagNotificationScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingTags();
    }, []);

    const fetchPendingTags = async () => {
        try {
            setLoading(true);
            // TODO: Call API
            // const response = await fetch('/api/tagging/tags/pending');
            // const data = await response.json();
            // setTags(data.data);

            // Mock data
            setTags([
                {
                    id: '1',
                    tagger: { firstName: 'Sarah', lastName: 'Johnson' },
                    event: { title: 'Brooklyn Concert', date: new Date('2024-11-15') },
                    message: 'Remember this amazing night?',
                    createdAt: new Date(),
                },
                {
                    id: '2',
                    tagger: { firstName: 'Mike', lastName: 'Chen' },
                    event: { title: 'Central Park Meetup', date: new Date('2024-11-10') },
                    message: null,
                    createdAt: new Date(),
                },
            ]);
        } catch (error) {
            console.error('Error fetching tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (tagId: string) => {
        try {
            // TODO: Call API
            // await fetch(`/api/tagging/tags/${tagId}/verify`, { method: 'POST' });

            setTags(prev => prev.filter(t => t.id !== tagId));
        } catch (error) {
            console.error('Error verifying tag:', error);
        }
    };

    const handleDecline = async (tagId: string) => {
        try {
            // TODO: Call API
            // await fetch(`/api/tagging/tags/${tagId}/decline`, { method: 'POST' });

            setTags(prev => prev.filter(t => t.id !== tagId));
        } catch (error) {
            console.error('Error declining tag:', error);
        }
    };

    const renderTag = ({ item }: any) => (
        <View style={[styles.tagCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.tagHeader}>
                <View style={[styles.icon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="pricetag" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.tagInfo}>
                    <Text style={[styles.taggerName, { color: theme.colors.text }]}>
                        {item.tagger.firstName} {item.tagger.lastName} tagged you
                    </Text>
                    <Text style={[styles.eventTitle, { color: theme.colors.textSecondary }]}>
                        in "{item.event.title}"
                    </Text>
                    <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>
                        {format(new Date(item.event.date), 'MMM d, yyyy')}
                    </Text>
                </View>
            </View>

            {item.message && (
                <View style={[styles.messageBox, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.message, { color: theme.colors.text }]}>
                        "{item.message}"
                    </Text>
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.declineButton, { borderColor: theme.colors.border }]}
                    onPress={() => handleDecline(item.id)}
                >
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                    <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                        Decline
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.verifyButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleVerify(item.id)}
                >
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                    <Text style={[styles.buttonText, { color: '#FFF' }]}>
                        Confirm
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tag Notifications</Text>
                <View style={{ width: 28 }} />
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                        Loading tags...
                    </Text>
                </View>
            ) : tags.length > 0 ? (
                <FlatList
                    data={tags}
                    renderItem={renderTag}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="pricetag-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No pending tags
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
    list: {
        padding: 16,
    },
    tagCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tagHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    icon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tagInfo: {
        flex: 1,
    },
    taggerName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 14,
        marginBottom: 2,
    },
    eventDate: {
        fontSize: 12,
    },
    messageBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    declineButton: {
        borderWidth: 1,
    },
    verifyButton: {
        // backgroundColor set inline
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
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
