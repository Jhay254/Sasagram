import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SharedEvent {
    id: string;
    title: string;
    date: string;
    otherUser: {
        id: string;
        name: string;
        profilePictureUrl: string;
    };
}

export default function CollaborationInviteScreen({ navigation }: any) {
    const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<SharedEvent | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [message, setMessage] = useState('');
    const [revenueSplit, setRevenueSplit] = useState(50);

    useEffect(() => {
        loadSharedEvents();
    }, []);

    const loadSharedEvents = async () => {
        setLoading(true);
        try {
            // Get authentication token
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            // Get shared events from Memory Graph
            const response = await fetch('/api/memory-graph/shared-events', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setSharedEvents(data.events);
        } catch (error) {
            console.error('Error loading shared events:', error);
        } finally {
            setLoading(false);
        }
    };

    const openInviteModal = (event: SharedEvent) => {
        setSelectedEvent(event);
        setShowInviteModal(true);
        setMessage(`Hey! I'd love to collaborate on a merged chapter about "${event.title}". Let's combine our perspectives!`);
    };

    const sendInvitation = async () => {
        if (!selectedEvent) return;

        try {
            // Get authentication token
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
            }

            const response = await fetch('/api/collaboration/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipientId: selectedEvent.otherUser.id,
                    sharedEventId: selectedEvent.id,
                    message,
                    proposedSplit: revenueSplit / 100,
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Collaboration invitation sent!');
                setShowInviteModal(false);
                navigation.goBack();
            } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            Alert.alert('Error', 'Failed to send invitation');
        }
    };

    const renderSharedEvent = ({ item }: { item: SharedEvent }) => (
        <TouchableOpacity
            style={styles.eventCard}
            onPress={() => openInviteModal(item)}
        >
            <View style={styles.eventHeader}>
                <Ionicons name="link" size={24} color="#007AFF" />
                <Text style={styles.eventTitle}>{item.title}</Text>
            </View>
            <Text style={styles.eventDate}>{new Date(item.date).toLocaleDateString()}</Text>
            <View style={styles.collaboratorInfo}>
                <Text style={styles.collaboratorText}>
                    Shared with: {item.otherUser.name}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => openInviteModal(item)}
            >
                <Ionicons name="paper-plane" size={16} color="#FFF" />
                <Text style={styles.inviteButtonText}>Suggest Merge</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Collaboration Opportunities</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Finding shared memories...</Text>
                </View>
            ) : (
                <FlatList
                    data={sharedEvents}
                    renderItem={renderSharedEvent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#666" />
                            <Text style={styles.emptyText}>No shared events found</Text>
                            <Text style={styles.emptySubtext}>
                                Connect with friends who have Lifeline accounts to find shared memories
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Invitation Modal */}
            <Modal
                visible={showInviteModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInviteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Send Collaboration Invite</Text>
                            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {selectedEvent && (
                            <>
                                <Text style={styles.modalSubtitle}>
                                    To: {selectedEvent.otherUser.name}
                                </Text>
                                <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>

                                <Text style={styles.label}>Message</Text>
                                <TextInput
                                    style={styles.messageInput}
                                    value={message}
                                    onChangeText={setMessage}
                                    multiline
                                    placeholder="Add a personal message..."
                                    placeholderTextColor="#666"
                                />

                                <Text style={styles.label}>Revenue Split</Text>
                                <View style={styles.splitContainer}>
                                    <View style={styles.splitOption}>
                                        <Text style={styles.splitLabel}>You</Text>
                                        <Text style={styles.splitValue}>{revenueSplit}%</Text>
                                    </View>
                                    <View style={styles.splitSlider}>
                                        {/* Simplified - would use Slider component in production */}
                                        <View style={styles.splitButtons}>
                                            <TouchableOpacity
                                                onPress={() => setRevenueSplit(Math.max(0, revenueSplit - 10))}
                                                style={styles.splitButton}
                                            >
                                                <Ionicons name="remove" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => setRevenueSplit(Math.min(100, revenueSplit + 10))}
                                                style={styles.splitButton}
                                            >
                                                <Ionicons name="add" size={20} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <View style={styles.splitOption}>
                                        <Text style={styles.splitLabel}>Them</Text>
                                        <Text style={styles.splitValue}>{100 - revenueSplit}%</Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.sendButton} onPress={sendInvitation}>
                                    <Text style={styles.sendButtonText}>Send Invitation</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        fontSize: 16,
    },
    list: {
        padding: 16,
    },
    eventCard: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
        flex: 1,
    },
    eventDate: {
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
    },
    collaboratorInfo: {
        marginVertical: 8,
    },
    collaboratorText: {
        color: '#666',
        fontSize: 14,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    inviteButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
    },
    modalEventTitle: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
    },
    label: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    messageInput: {
        backgroundColor: '#000',
        color: '#FFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        minHeight: 100,
        marginBottom: 20,
        textAlignVertical: 'top',
    },
    splitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    splitOption: {
        alignItems: 'center',
    },
    splitLabel: {
        color: '#999',
        fontSize: 12,
    },
    splitValue: {
        color: '#007AFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    splitSlider: {
        flex: 1,
        marginHorizontal: 16,
    },
    splitButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    splitButton: {
        backgroundColor: '#333',
        padding: 8,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
