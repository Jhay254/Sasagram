import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChapterEditorScreen({ route, navigation }: any) {
    const { chapterId } = route.params || {};

    // Mock chapter data - replace with actual API data
    const [chapter, setChapter] = useState({
        title: 'The Beginning',
        timeperiod: '2015-2017',
        content: `The story begins in 2015, a time of new beginnings and fresh perspectives. Through Instagram posts and tweets, we see a journey of discovery and growth.\n\nThose early days were filled with excitement and curiosity. Every photo captured a moment of wonder, every post a thought worth sharing. The world felt vast and full of possibilities.\n\nFrom the cafes of downtown to the trails in the mountains, each location told its own story. Friends gathered, laughter echoed, and memories were made that would last a lifetime.\n\nThis was just the beginning of something extraordinary.`,
    });

    const [isEdited, setIsEdited] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleSave = () => {
        // TODO: Implement actual API call
        Alert.alert('Success', 'Chapter saved successfully!', [
            {
                text: 'OK',
                onPress: () => navigation.goBack(),
            },
        ]);
    };

    const handleDiscard = () => {
        if (isEdited) {
            Alert.alert('Discard Changes?', 'Your edits will be lost.', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } else {
            navigation.goBack();
        }
    };

    const handleRegenerate = () => {
        Alert.alert(
            'Regenerate Chapter?',
            'This will create new AI-generated content for this chapter. Current content will be replaced.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Regenerate',
                    onPress: async () => {
                        setIsRegenerating(true);
                        // Simulate AI regeneration
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        setIsRegenerating(false);
                        Alert.alert('Success', 'Chapter regenerated with new AI content!');
                    },
                },
            ]
        );
    };

    const handleImprove = () => {
        Alert.alert(
            'AI Suggestions',
            'Get AI-powered suggestions to improve your chapter:',
            [
                {
                    text: 'Make it longer',
                    onPress: () => console.log('Expand content'),
                },
                {
                    text: 'Make it more engaging',
                    onPress: () => console.log('Improve engagement'),
                },
                {
                    text: 'Fix grammar',
                    onPress: () => console.log('Fix grammar'),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const wordCount = chapter.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#F857A6', '#FF5858']} style={styles.gradient}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleDiscard} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Chapter</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                        <Text style={[styles.headerButtonText, styles.saveText]}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Chapter Metadata */}
                    <View style={styles.metadataCard}>
                        <Text style={styles.label}>Chapter Title</Text>
                        <TextInput
                            style={styles.titleInput}
                            value={chapter.title}
                            onChangeText={(text) => {
                                setChapter({ ...chapter, title: text });
                                setIsEdited(true);
                            }}
                            placeholder="Enter chapter title..."
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />

                        <Text style={styles.label}>Time Period</Text>
                        <TextInput
                            style={styles.input}
                            value={chapter.timeperiod}
                            onChangeText={(text) => {
                                setChapter({ ...chapter, timeperiod: text });
                                setIsEdited(true);
                            }}
                            placeholder="e.g., 2015-2017"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        />

                        <View style={styles.statsRow}>
                            <Text style={styles.stat}>📝 {wordCount} words</Text>
                            <Text style={styles.stat}>⏱️ {readTime} min read</Text>
                        </View>
                    </View>

                    {/* Content Editor */}
                    <View style={styles.editorCard}>
                        <Text style={styles.editorLabel}>Chapter Content</Text>
                        <TextInput
                            style={styles.contentInput}
                            value={chapter.content}
                            onChangeText={(text) => {
                                setChapter({ ...chapter, content: text });
                                setIsEdited(true);
                            }}
                            multiline
                            numberOfLines={20}
                            placeholder="Write your chapter content..."
                            placeholderTextColor="#999"
                            textAlignVertical="top"
                        />
                    </View>

                    {/* AI Tools */}
                    <View style={styles.aiToolsCard}>
                        <Text style={styles.aiToolsTitle}>✨ AI Assistant</Text>
                        <TouchableOpacity
                            style={styles.aiButton}
                            onPress={handleImprove}
                            disabled={isRegenerating}
                        >
                            <Text style={styles.aiButtonText}>💡 Get AI Suggestions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.aiButton, styles.regenerateButton]}
                            onPress={handleRegenerate}
                            disabled={isRegenerating}
                        >
                            <Text style={styles.aiButtonText}>
                                {isRegenerating ? '⏳ Regenerating...' : '🔄 Regenerate with AI'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tips */}
                    <View style={styles.tipsCard}>
                        <Text style={styles.tipsTitle}>📌 Writing Tips</Text>
                        <Text style={styles.tip}>• Be authentic and personal</Text>
                        <Text style={styles.tip}>• Focus on meaningful moments</Text>
                        <Text style={styles.tip}>• Include specific details and emotions</Text>
                        <Text style={styles.tip}>• Maintain chronological flow</Text>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerButton: {
        padding: 8,
    },
    headerButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    saveText: {
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 40,
    },
    metadataCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        fontWeight: '600',
    },
    titleInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#FFF',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    editorCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    editorLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    contentInput: {
        fontSize: 16,
        color: '#333',
        lineHeight: 28,
        minHeight: 300,
    },
    aiToolsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    aiToolsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    aiButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    regenerateButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    aiButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    tipsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 20,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    tip: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        lineHeight: 20,
    },
});
