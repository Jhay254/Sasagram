import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen({ navigation }: any) {
    const { user } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleChangePassword = () => {
        Alert.alert('Change Password', 'This feature will be available soon');
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => console.log('Account deleted'),
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Account Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Email</Text>
                                <Text style={styles.settingValue}>{user?.email}</Text>
                            </View>
                            <TouchableOpacity style={styles.settingRow} onPress={handleChangePassword}>
                                <Text style={styles.settingLabel}>Password</Text>
                                <Text style={styles.settingLink}>Change →</Text>
                            </TouchableOpacity>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Account Type</Text>
                                <Text style={styles.settingValue}>{user?.role}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Notifications Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notifications</Text>
                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>All Notifications</Text>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: '#ccc', true: '#667eea' }}
                                />
                            </View>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Email Notifications</Text>
                                <Switch
                                    value={emailNotifications}
                                    onValueChange={setEmailNotifications}
                                    trackColor={{ false: '#ccc', true: '#667eea' }}
                                    disabled={!notificationsEnabled}
                                />
                            </View>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Push Notifications</Text>
                                <Switch
                                    value={pushNotifications}
                                    onValueChange={setPushNotifications}
                                    trackColor={{ false: '#ccc', true: '#667eea' }}
                                    disabled={!notificationsEnabled}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Appearance Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Appearance</Text>
                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Dark Mode</Text>
                                <Switch
                                    value={darkMode}
                                    onValueChange={setDarkMode}
                                    trackColor={{ false: '#ccc', true: '#667eea' }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Privacy Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Privacy & Security</Text>
                        <View style={styles.card}>
                            <TouchableOpacity style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Privacy Policy</Text>
                                <Text style={styles.settingLink}>View →</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Terms of Service</Text>
                                <Text style={styles.settingLink}>View →</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Data Management</Text>
                                <Text style={styles.settingLink}>Manage →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>App Version</Text>
                                <Text style={styles.settingValue}>1.0.0</Text>
                            </View>
                            <TouchableOpacity style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Help & Support</Text>
                                <Text style={styles.settingLink}>Contact →</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
                        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
                            <Text style={styles.dangerButtonText}>Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dangerTitle: {
        color: '#FF5858',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
    },
    settingValue: {
        fontSize: 16,
        color: '#666',
    },
    settingLink: {
        fontSize: 16,
        color: '#667eea',
        fontWeight: '600',
    },
    dangerButton: {
        backgroundColor: 'rgba(255, 88, 88, 0.2)',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FF5858',
    },
    dangerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF5858',
    },
});
