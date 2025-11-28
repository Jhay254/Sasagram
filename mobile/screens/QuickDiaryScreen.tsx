import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOODS = [
    { emoji: '😊', label: 'Happy', value: 'happy' },
    { emoji: '😌', label: 'Calm', value: 'calm' },
    { emoji: '😢', label: 'Sad', value: 'sad' },
    { emoji: '😠', label: 'Angry', value: 'angry' },
    { emoji: '🤔', label: 'Thoughtful', value: 'thoughtful' },
    { emoji: '😴', label: 'Tired', value: 'tired' },
];

export default function QuickDiaryScreen({ navigation, route }: any) {
    const { theme } = useTheme();
    const [content, setContent] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedMood, setSelectedMood] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPrompt();
    }, []);

    const fetchPrompt = async () => {
        try {
            // TODO: Call API
            // const response = await fetch('/api/diary/prompt');
            // const data = await response.json();
            // setPrompt(data.data.prompt);

            // Mock prompt
            setPrompt("What made you smile today?");
        } catch (error) {
            console.error('Error fetching prompt:', error);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Please write something');
            return;
        }

        try {
            setSaving(true);

            // Try to save to backend
            try {
                // TODO: Call API
                // await fetch('/api/diary/entries', {
                //   method: 'POST',
                //   body: JSON.stringify({ content, mood: selectedMood }),
                // });

                Alert.alert('Success', 'Diary entry saved!', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } catch (error) {
                // Save offline if network fails
                await saveOffline();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const saveOffline = async () => {
        try {
            const offlineEntries = await AsyncStorage.getItem('offline_diary_entries');
            const entries = offlineEntries ? JSON.parse(offlineEntries) : [];

            entries.push({
                content,
                mood: selectedMood,
                timestamp: new Date().toISOString(),
            });

            await AsyncStorage.setItem('offline_diary_entries', JSON.stringify(entries));

            Alert.alert('Saved Offline', 'Your entry will sync when you\'re back online', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            throw new Error('Failed to save offline');
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    Quick Diary
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveButton, { color: theme.colors.primary }]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Prompt */}
                <View style={[styles.promptContainer, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
                    <Text style={[styles.promptText, { color: theme.colors.text }]}>
                        {prompt}
                    </Text>
                </View>

                {/* Mood Selector */}
                <View style={styles.moodSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        How are you feeling?
                    </Text>
                    <View style={styles.moods}>
                        {MOODS.map(mood => (
                            <TouchableOpacity
                                key={mood.value}
                                style={[
                                    styles.moodButton,
                                    {
                                        backgroundColor:
                                            selectedMood === mood.value
                                                ? theme.colors.primary + '20'
                                                : theme.colors.surface,
                                        borderColor:
                                            selectedMood === mood.value
                                                ? theme.colors.primary
                                                : theme.colors.border,
                                    },
                                ]}
                                onPress={() => setSelectedMood(mood.value)}
                            >
                                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>
                                    {mood.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        Your thoughts
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
                        placeholder="Write freely..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        numberOfLines={10}
                        textAlignVertical="top"
                        autoFocus
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    promptContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    promptText: {
        flex: 1,
        fontSize: 16,
        fontStyle: 'italic',
    },
    moodSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    moods: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    moodButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    moodEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    moodLabel: {
        fontSize: 12,
    },
    contentSection: {
        marginBottom: 24,
    },
    input: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 200,
    },
});
