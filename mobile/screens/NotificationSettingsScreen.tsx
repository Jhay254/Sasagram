import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function NotificationSettingsScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [preferences, setPreferences] = useState({
        pushNotifications: true,
        emailNotifications: true,
        tagNotifications: true,
        followNotifications: true,
        reviewNotifications: true,
        collisionNotifications: true,
        milestoneNotifications: true,
    });

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            // TODO: Call API
            // const response = await fetch('/api/notifications/preferences');
            // const data = await response.json();
            // setPreferences(data.data);
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const updatePreference = async (key: string, value: boolean) => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);

        try {
            // TODO: Call API
            // await fetch('/api/notifications/preferences', {
            //   method: 'PUT',
            //   body: JSON.stringify(newPrefs),
            // });
        } catch (error) {
            console.error('Error updating preferences:', error);
            // Revert on error
            setPreferences(preferences);
        }
    };

    const SettingItem = ({
        label,
        description,
        value,
        onChange,
        icon,
    }: {
        label: string;
        description: string;
        value: boolean;
        onChange: (value: boolean) => void;
        icon: string;
    }) => (
        <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
                <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                        {label}
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                        {description}
                    </Text>
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFF"
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Notification Settings
                </Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Delivery Methods
                    </Text>
                    <SettingItem
                        label="Push Notifications"
                        description="Receive notifications on your device"
                        value={preferences.pushNotifications}
                        onChange={v => updatePreference('pushNotifications', v)}
                        icon="notifications"
                    />
                    <SettingItem
                        label="Email Notifications"
                        description="Receive notifications via email"
                        value={preferences.emailNotifications}
                        onChange={v => updatePreference('emailNotifications', v)}
                        icon="mail"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Notification Types
                    </Text>
                    <SettingItem
                        label="Tags"
                        description="When someone tags you in an event"
                        value={preferences.tagNotifications}
                        onChange={v => updatePreference('tagNotifications', v)}
                        icon="pricetag"
                    />
                    <SettingItem
                        label="Followers"
                        description="When someone follows you"
                        value={preferences.followNotifications}
                        onChange={v => updatePreference('followNotifications', v)}
                        icon="person-add"
                    />
                    <SettingItem
                        label="Reviews & Reactions"
                        description="When someone reviews or reacts to your content"
                        value={preferences.reviewNotifications}
                        onChange={v => updatePreference('reviewNotifications', v)}
                        icon="star"
                    />
                    <SettingItem
                        label="Memory Collisions"
                        description="When you share a memory with someone"
                        value={preferences.collisionNotifications}
                        onChange={v => updatePreference('collisionNotifications', v)}
                        icon="git-merge"
                    />
                    <SettingItem
                        label="Milestones"
                        description="When you achieve a milestone"
                        value={preferences.milestoneNotifications}
                        onChange={v => updatePreference('milestoneNotifications', v)}
                        icon="trophy"
                    />
                </View>
            </ScrollView>
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
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    settingText: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        lineHeight: 18,
    },
});
