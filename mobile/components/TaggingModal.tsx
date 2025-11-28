import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TaggingModalProps {
    visible: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
}

export default function TaggingModal({ visible, onClose, eventId, eventTitle }: TaggingModalProps) {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock users for search
    const [searchResults] = useState([
        { id: '1', name: 'Sarah Johnson', email: 'sarah@example.com' },
        { id: '2', name: 'Mike Chen', email: 'mike@example.com' },
        { id: '3', name: 'Emma Davis', email: 'emma@example.com' },
    ]);

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleTag = async () => {
        if (selectedUsers.length === 0) {
            Alert.alert('Error', 'Please select at least one person to tag');
            return;
        }

        try {
            setLoading(true);
            // TODO: Call API
            // await fetch('/api/tagging/tags', {
            //   method: 'POST',
            //   body: JSON.stringify({ eventId, taggedUserIds: selectedUsers, message }),
            // });

            Alert.alert(
                'Success',
                `Tagged ${selectedUsers.length} person${selectedUsers.length > 1 ? 's' : ''}!`,
                [{ text: 'OK', onPress: onClose }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderUser = ({ item }: any) => {
        const isSelected = selectedUsers.includes(item.id);

        return (
            <TouchableOpacity
                style={[
                    styles.userItem,
                    {
                        backgroundColor: isSelected
                            ? theme.colors.primary + '20'
                            : theme.colors.surface,
                    },
                ]}
                onPress={() => toggleUser(item.id)}
            >
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                        {item.email}
                    </Text>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Tag People
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {eventTitle}
                    </Text>

                    <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.text }]}
                            placeholder="Search people..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <FlatList
                        data={searchResults.filter(u =>
                            u.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )}
                        renderItem={renderUser}
                        keyExtractor={item => item.id}
                        style={styles.userList}
                        contentContainerStyle={styles.userListContent}
                    />

                    <TextInput
                        style={[
                            styles.messageInput,
                            {
                                backgroundColor: theme.colors.surface,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                            },
                        ]}
                        placeholder="Add a message (optional)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[
                            styles.tagButton,
                            {
                                backgroundColor: selectedUsers.length > 0
                                    ? theme.colors.primary
                                    : theme.colors.border,
                            },
                        ]}
                        onPress={handleTag}
                        disabled={loading || selectedUsers.length === 0}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.tagButtonText}>
                                Tag {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    userList: {
        maxHeight: 300,
    },
    userListContent: {
        gap: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
    },
    messageInput: {
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 80,
    },
    tagButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    tagButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
