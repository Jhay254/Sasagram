import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Mock data - replace with actual API data
const mockBiography = {
    title: 'My Digital Journey',
    description: 'A story woven from memories, moments, and milestones',
    chapters: [
        {
            id: '1',
            title: 'The Beginning',
            timeperiod: '2015-2017',
            summary: 'Where it all started',
            content: `The story begins in 2015, a time of new beginnings and fresh perspectives. Through Instagram posts and tweets, we see a journey of discovery and growth.\n\nThose early days were filled with excitement and curiosity. Every photo captured a moment of wonder, every post a thought worth sharing. The world felt vast and full of possibilities.\n\nFrom the cafes of downtown to the trails in the mountains, each location told its own story. Friends gathered, laughter echoed, and memories were made that would last a lifetime.\n\nThis was just the beginning of something extraordinary.`,
            wordCount: 102,
            readTime: 1,
        },
        {
            id: '2',
            title: 'Finding My Path',
            timeperiod: '2018-2020',
            summary: 'Career beginnings and personal growth',
            content: `2018 marked a turning point. The data shows a shift - more professional posts, LinkedIn connections growing, career milestones celebrated.\n\nThe transition wasn't always smooth. There were challenges documented in tweets, moments of doubt captured in reflective posts. But persistence prevailed.\n\nBy 2020, a clear direction emerged. The emails tell stories of projects completed, collaborations formed, and recognition earned. Each achievement building upon the last.\n\nThis chapter represents transformation - from uncertainty to confidence, from searching to finding.`,
            wordCount: 86,
            readTime: 1,
        },
        {
            id: '3',
            title: 'Adventures Await',
            timeperiod: '2021-2023',
            summary: 'Travel, experiences, and connections',
            content: `The world opened up. Instagram became a canvas of adventures - from Tokyo's neon streets to Barcelona's architectural wonders.\n\nEach destination left its mark. Photos with location tags painting a map of experiences. Street food in Thailand, art museums in Paris, hiking trails in New Zealand.\n\nBut it wasn't just about places. The people met along the way, the cultures experienced, the perspectives gained - these formed the true treasures.\n\nThese years prove that life's greatest stories come from stepping outside comfort zones.`,
            wordCount: 88,
            readTime: 1,
        },
    ],
};

export default function BiographyViewerScreen({ navigation }: any) {
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const currentChapter = mockBiography.chapters[currentChapterIndex];

    const nextChapter = () => {
        if (currentChapterIndex < mockBiography.chapters.length - 1) {
            setCurrentChapterIndex(currentChapterIndex + 1);
        }
    };

    const previousChapter = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(currentChapterIndex - 1);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#134E5E', '#71B280']} style={styles.gradient}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ChapterEditor', { chapterId: currentChapter.id })}
                        style={styles.editButton}
                    >
                        <Text style={styles.editText}>Edit ✏️</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Biography Title (only show on first chapter) */}
                    {currentChapterIndex === 0 && (
                        <View style={styles.titleSection}>
                            <Text style={styles.biographyTitle}>{mockBiography.title}</Text>
                            <Text style={styles.biographyDescription}>{mockBiography.description}</Text>
                            <View style={styles.divider} />
                        </View>
                    )}

                    {/* Chapter Info */}
                    <View style={styles.chapterHeader}>
                        <Text style={styles.chapterNumber}>
                            Chapter {currentChapterIndex + 1} of {mockBiography.chapters.length}
                        </Text>
                        <Text style={styles.chapterTitle}>{currentChapter.title}</Text>
                        <Text style={styles.chapterTimeperiod}>{currentChapter.timeperiod}</Text>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadata}>📖 {currentChapter.readTime} min read</Text>
                            <Text style={styles.metadata}>📝 {currentChapter.wordCount} words</Text>
                        </View>
                    </View>

                    {/* Chapter Content */}
                    <View style={styles.contentCard}>
                        <Text style={styles.content}>{currentChapter.content}</Text>
                    </View>

                    {/* Chapter Timeline */}
                    <View style={styles.timelineCard}>
                        <Text style={styles.timelineTitle}>Chapter Timeline</Text>
                        <View style={styles.timelineContainer}>
                            {mockBiography.chapters.map((chapter, index) => (
                                <TouchableOpacity
                                    key={chapter.id}
                                    style={[
                                        styles.timelineItem,
                                        index === currentChapterIndex && styles.timelineItemActive,
                                    ]}
                                    onPress={() => setCurrentChapterIndex(index)}
                                >
                                    <View
                                        style={[
                                            styles.timelineDot,
                                            index === currentChapterIndex && styles.timelineDotActive,
                                        ]}
                                    />
                                    <View style={styles.timelineContent}>
                                        <Text
                                            style={[
                                                styles.timelineChapterTitle,
                                                index === currentChapterIndex && styles.timelineChapterTitleActive,
                                            ]}
                                        >
                                            {chapter.title}
                                        </Text>
                                        <Text style={styles.timelineChapterPeriod}>{chapter.timeperiod}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Navigation Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.navButton, currentChapterIndex === 0 && styles.navButtonDisabled]}
                        onPress={previousChapter}
                        disabled={currentChapterIndex === 0}
                    >
                        <Text
                            style={[
                                styles.navButtonText,
                                currentChapterIndex === 0 && styles.navButtonTextDisabled,
                            ]}
                        >
                            ← Previous
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.pageIndicator}>
                        {mockBiography.chapters.map((_, index) => (
                            <View
                                key={index}
                                style={[styles.dot, index === currentChapterIndex && styles.dotActive]}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            currentChapterIndex === mockBiography.chapters.length - 1 && styles.navButtonDisabled,
                        ]}
                        onPress={nextChapter}
                        disabled={currentChapterIndex === mockBiography.chapters.length - 1}
                    >
                        <Text
                            style={[
                                styles.navButtonText,
                                currentChapterIndex === mockBiography.chapters.length - 1 &&
                                styles.navButtonTextDisabled,
                            ]}
                        >
                            Next →
                        </Text>
                    </TouchableOpacity>
                </View>
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
    editButton: {
        padding: 8,
    },
    editText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    titleSection: {
        marginBottom: 32,
    },
    biographyTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    biographyDescription: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    divider: {
        width: 60,
        height: 3,
        backgroundColor: '#FFF',
        alignSelf: 'center',
    },
    chapterHeader: {
        marginBottom: 24,
    },
    chapterNumber: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chapterTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    chapterTimeperiod: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 12,
    },
    metadataRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metadata: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    contentCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
    },
    content: {
        fontSize: 16,
        color: '#333',
        lineHeight: 28,
    },
    timelineCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    timelineTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    timelineContainer: {
        gap: 12,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    timelineItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginRight: 12,
    },
    timelineDotActive: {
        backgroundColor: '#FFF',
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    timelineContent: {
        flex: 1,
    },
    timelineChapterTitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    timelineChapterTitleActive: {
        color: '#FFF',
        fontSize: 15,
    },
    timelineChapterPeriod: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    navButton: {
        padding: 12,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    navButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    navButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
    pageIndicator: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dotActive: {
        backgroundColor: '#FFF',
        width: 24,
    },
});
