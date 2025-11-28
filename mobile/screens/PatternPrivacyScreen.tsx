import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface PrivacySettings {
    enablePatternDetection: boolean;
    enablePredictions: boolean;
    shareWithNetwork: boolean;
    shareCareerPatterns: boolean;
    shareRelationshipPatterns: boolean;
    shareHealthPatterns: boolean;
    allowAIAnalysis: boolean;
}

export default function PatternPrivacyScreen({ navigation }: any) {
    const [settings, setSettings] = useState<PrivacySettings>({
        enablePatternDetection: true,
        enablePredictions: true,
        shareWithNetwork: false,
        shareCareerPatterns: false,
        shareRelationshipPatterns: false,
        shareHealthPatterns: false,
        allowAIAnalysis: true,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPrivacySettings();
    }, []);

    const loadPrivacySettings = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.error('No authentication token found');
                return;
            }
            const response = await fetch('/api/pattern-privacy', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error loading privacy settings:', error);
        }
    };

    const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
        // Update locally first for immediate feedback
        setSettings({ ...settings, [key]: value });

        // Then save to server
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.error('No authentication token found');
                setSettings({ ...settings, [key]: !value });
                return;
            }
            await fetch('/api/pattern-privacy', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ [key]: value }),
            });
        } catch (error) {
            console.error('Error updating setting:', error);
            // Revert on error
            setSettings({ ...settings, [key]: !value });
        }
    };

    const deleteAllPatterns = () => {
        Alert.alert(
            'Delete All Patterns?',
            'This will permanently delete all detected patterns and predictions. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            if (!token) {
                                Alert.alert('Error', 'Authentication required');
                                return;
                            }
                            await fetch('/api/patterns', {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            Alert.alert('Success', 'All patterns deleted');
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete patterns');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pattern Privacy</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pattern Detection</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Enable Pattern Detection</Text>
                        <Text style={styles.settingDescription}>
                            Allow AI to detect recurring patterns in your life
                        </Text>
                    </View>
                    <Switch
                        value={settings.enablePatternDetection}
                        onValueChange={(value) => updateSetting('enablePatternDetection', value)}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.enablePatternDetection ? '#007AFF' : '#666'}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Enable Predictions</Text>
                        <Text style={styles.settingDescription}>
                            Generate AI-powered predictions based on your patterns
                        </Text>
                    </View>
                    <Switch
                        value={settings.enablePredictions}
                        onValueChange={(value) => updateSetting('enablePredictions', value)}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.enablePredictions ? '#007AFF' : '#666'}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Allow AI Analysis</Text>
                        <Text style={styles.settingDescription}>
                            Let AI analyze your content for pattern detection (opt-in)
                        </Text>
                    </View>
                    <Switch
                        value={settings.allowAIAnalysis}
                        onValueChange={(value) => updateSetting('allowAIAnalysis', value)}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.allowAIAnalysis ? '#007AFF' : '#666'}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sharing Settings</Text>
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Share With Network</Text>
                        <Text style={styles.settingDescription}>
                            Allow your connections to see your patterns (opt-in)
                        </Text>
                    </View>
                    <Switch
                        value={settings.shareWithNetwork}
                        onValueChange={(value) => updateSetting('shareWithNetwork', value)}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.shareWithNetwork ? '#007AFF' : '#666'}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category-Specific Sharing</Text>
                <Text style={styles.sectionDescription}>
                    Choose which pattern categories can be shared (if sharing is enabled)
                </Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Career Patterns</Text>
                    </View>
                    <Switch
                        value={settings.shareCareerPatterns}
                        onValueChange={(value) => updateSetting('shareCareerPatterns', value)}
                        disabled={!settings.shareWithNetwork}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.shareCareerPatterns ? '#007AFF' : '#666'}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Relationship Patterns</Text>
                    </View>
                    <Switch
                        value={settings.shareRelationshipPatterns}
                        onValueChange={(value) => updateSetting('shareRelationshipPatterns', value)}
                        disabled={!settings.shareWithNetwork}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.shareRelationshipPatterns ? '#007AFF' : '#666'}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Health Patterns</Text>
                    </View>
                    <Switch
                        value={settings.shareHealthPatterns}
                        onValueChange={(value) => updateSetting('shareHealthPatterns', value)}
                        disabled={!settings.shareWithNetwork}
                        trackColor={{ false: '#333', true: '#007AFF40' }}
                        thumbColor={settings.shareHealthPatterns ? '#007AFF' : '#666'}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <TouchableOpacity style={styles.dangerButton} onPress={deleteAllPatterns}>
                    <Ionicons name="trash" size={20} color="#F44336" />
                    <Text style={styles.dangerButtonText}>Delete All Patterns</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                    All pattern detection is opt-in by default. Your data is never shared without your
                    explicit consent.
                </Text>
            </View>
        </ScrollView>
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
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    sectionDescription: {
        color: '#666',
        fontSize: 14,
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    settingDescription: {
        color: '#666',
        fontSize: 12,
        marginTop: 4,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4433620',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
    },
    dangerButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#007AFF20',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    infoText: {
        color: '#007AFF',
        fontSize: 14,
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
});
