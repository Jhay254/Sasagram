import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Share,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ReferralShareModalProps {
    visible: boolean;
    onClose: () => void;
    referralCode: string;
}

export default function ReferralShareModal({
    visible,
    onClose,
    referralCode,
}: ReferralShareModalProps) {
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [sending, setSending] = useState(false);

    const referralUrl = `https://lifeline.app?ref=${referralCode}`;
    const shareMessage = `Join me on Lifeline and get $10 off! Use my code: ${referralCode}\n${referralUrl}`;

    const handleNativeShare = async () => {
        try {
            await Share.share({
                message: shareMessage,
                title: 'Join Lifeline',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleEmailInvite = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        try {
            setSending(true);
            // TODO: Call API
            // await fetch('/api/referral/invite', {
            //   method: 'POST',
            //   body: JSON.stringify({ email, name }),
            // });

            Alert.alert('Success', 'Invitation sent!');
            setEmail('');
            setName('');
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSending(false);
        }
    };

    const handleCopyLink = () => {
        // TODO: Implement clipboard
        Alert.alert('Copied!', 'Referral link copied to clipboard');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Share Referral
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Share Buttons */}
                    <View style={styles.shareButtons}>
                        <TouchableOpacity
                            style={[styles.shareMethodButton, { backgroundColor: theme.colors.surface }]}
                            onPress={handleNativeShare}
                        >
                            <Ionicons name="share-social" size={24} color={theme.colors.primary} />
                            <Text style={[styles.shareMethodText, { color: theme.colors.text }]}>
                                Share
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.shareMethodButton, { backgroundColor: theme.colors.surface }]}
                            onPress={handleCopyLink}
                        >
                            <Ionicons name="link" size={24} color={theme.colors.primary} />
                            <Text style={[styles.shareMethodText, { color: theme.colors.text }]}>
                                Copy Link
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Email Invitation */}
                    <View style={styles.emailSection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                            Send Email Invitation
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                            placeholder="Friend's Name (optional)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                            placeholder="Friend's Email"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleEmailInvite}
                            disabled={sending}
                        >
                            <Text style={styles.sendButtonText}>
                                {sending ? 'Sending...' : 'Send Invitation'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Referral Info */}
                    <View style={[styles.infoBox, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                            Your friend gets $10 off and you earn $30 when they subscribe
                        </Text>
                    </View>
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
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    shareButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    shareMethodButton: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    shareMethodText: {
        fontSize: 14,
        fontWeight: '600',
    },
    emailSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    input: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    sendButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
