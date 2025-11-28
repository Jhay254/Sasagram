import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Share,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ShareModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'biography' | 'profile';
    id: string;
    title: string;
    url: string;
}

const SOCIAL_PLATFORMS = [
    { id: 'native', name: 'More', icon: 'share-outline', color: '#3b82f6' },
    { id: 'copy', name: 'Copy Link', icon: 'copy-outline', color: '#6b7280' },
    { id: 'twitter', name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
];

export default function ShareModal({
    visible,
    onClose,
    type,
    id,
    title,
    url,
}: ShareModalProps) {
    const { theme } = useTheme();
    const [socialUrls, setSocialUrls] = useState<any>(null);

    React.useEffect(() => {
        if (visible) {
            fetchShareUrls();
        }
    }, [visible]);

    const fetchShareUrls = async () => {
        try {
            // TODO: Call API
            // const response = await fetch(`/api/sharing/urls/${type}/${id}`);
            // const data = await response.json();
            // setSocialUrls(data.data.socialUrls);

            // Mock data
            setSocialUrls({
                twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            });
        } catch (error) {
            console.error('Error fetching share URLs:', error);
        }
    };

    const handleShare = async (platform: string) => {
        try {
            if (platform === 'native') {
                await Share.share({
                    message: `${title}\n${url}`,
                    url: url,
                    title: title,
                });
            } else if (platform === 'copy') {
                // TODO: Implement clipboard
                Alert.alert('Copied!', 'Link copied to clipboard');
            } else if (socialUrls && socialUrls[platform]) {
                await Linking.openURL(socialUrls[platform]);
            }

            // Track share
            await trackShare(platform);
            onClose();
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const trackShare = async (platform: string) => {
        try {
            // TODO: Call API
            // await fetch('/api/sharing/track', {
            //   method: 'POST',
            //   body: JSON.stringify({ targetType: type, targetId: id, platform }),
            // });
        } catch (error) {
            console.error('Error tracking share:', error);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Share
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.platformsGrid}>
                        {SOCIAL_PLATFORMS.map((platform) => (
                            <TouchableOpacity
                                key={platform.id}
                                style={styles.platformButton}
                                onPress={() => handleShare(platform.id)}
                            >
                                <View
                                    style={[
                                        styles.platformIcon,
                                        { backgroundColor: platform.color + '20' },
                                    ]}
                                >
                                    <Ionicons name={platform.icon as any} size={28} color={platform.color} />
                                </View>
                                <Text style={[styles.platformName, { color: theme.colors.text }]}>
                                    {platform.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={[styles.urlBox, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.urlText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {url}
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
    platformsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    platformButton: {
        width: '30%',
        alignItems: 'center',
        gap: 8,
    },
    platformIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    platformName: {
        fontSize: 12,
        textAlign: 'center',
    },
    urlBox: {
        padding: 16,
        borderRadius: 12,
    },
    urlText: {
        fontSize: 14,
    },
});
