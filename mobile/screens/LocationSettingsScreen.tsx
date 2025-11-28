import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export default function LocationSettingsScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [settings, setSettings] = useState({
        trackingEnabled: false,
        backgroundTracking: false,
        shareWithOthers: false,
        precisionLevel: 'CITY', // EXACT, CITY, COUNTRY
    });
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

    useEffect(() => {
        checkPermissions();
        fetchSettings();
    }, []);

    const checkPermissions = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
    };

    const fetchSettings = async () => {
        try {
            // TODO: Call API
            // const response = await fetch('/api/location/privacy');
            // const data = await response.json();
            // setSettings(data.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required for this feature'
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    };

    const requestBackgroundPermission = async () => {
        try {
            const { status } = await Location.requestBackgroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Background Permission Denied',
                    'Background location is needed to detect nearby memories'
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error requesting background permission:', error);
            return false;
        }
    };

    const updateSetting = async (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };

        // Handle permission flows
        if (key === 'trackingEnabled' && value) {
            const granted = await requestLocationPermission();
            if (!granted) return;
        }

        if (key === 'backgroundTracking' && value) {
            const granted = await requestBackgroundPermission();
            if (!granted) return;

            // Start background location task
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                distanceInterval: 100, // Update every 100 meters
                showsBackgroundLocationIndicator: true,
            });
        } else if (key === 'backgroundTracking' && !value) {
            // Stop background tracking
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
            if (isRegistered) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
        }

        setSettings(newSettings);

        try {
            // TODO: Call API
            // await fetch('/api/location/privacy', {
            //   method: 'PUT',
            //   body: JSON.stringify(newSettings),
            // });
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const clearHistory = async () => {
        Alert.alert(
            'Clear Location History',
            'Are you sure you want to delete all your location history?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // TODO: Call API
                            // await fetch('/api/location/history', { method: 'DELETE' });
                            Alert.alert('Success', 'Location history deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete history');
                        }
                    },
                },
            ]
        );
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
                    Location Settings
                </Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Permission Status */}
                <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons
                        name={permissionStatus === 'granted' ? 'checkmark-circle' : 'alert-circle'}
                        size={24}
                        color={permissionStatus === 'granted' ? '#10b981' : '#f59e0b'}
                    />
                    <View style={styles.statusText}>
                        <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
                            Permission Status
                        </Text>
                        <Text style={[styles.statusValue, { color: theme.colors.textSecondary }]}>
                            {permissionStatus === 'granted' ? 'Granted' : 'Not Granted'}
                        </Text>
                    </View>
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <SettingItem
                        label="Location Tracking"
                        description="Allow Lifeline to track your location"
                        value={settings.trackingEnabled}
                        onChange={v => updateSetting('trackingEnabled', v)}
                        icon="location"
                    />
                    <SettingItem
                        label="Background Tracking"
                        description="Get notified when near past memories"
                        value={settings.backgroundTracking}
                        onChange={v => updateSetting('backgroundTracking', v)}
                        icon="navigate"
                    />
                    <SettingItem
                        label="Share with Others"
                        description="Let others see approximate locations"
                        value={settings.shareWithOthers}
                        onChange={v => updateSetting('shareWithOthers', v)}
                        icon="people"
                    />
                </View>

                {/* Clear History */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.dangerButton, { backgroundColor: theme.colors.surface }]}
                        onPress={clearHistory}
                    >
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                        <Text style={styles.dangerButtonText}>Clear Location History</Text>
                    </TouchableOpacity>
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
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        margin: 16,
        borderRadius: 12,
        gap: 12,
    },
    statusText: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 14,
    },
    section: {
        padding: 16,
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
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
});
