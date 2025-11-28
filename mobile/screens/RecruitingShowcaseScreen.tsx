import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

interface RecruitingData {
    companyName: string;
    logoUrl?: string;
    tagline: string;
    cultureHighlights: Array<{
        title: string;
        description: string;
        imageUrl?: string;
    }>;
    timeline: Array<{
        title: string;
        date: string;
        category: string;
    }>;
    careerPaths: Array<{
        role: string;
        description: string;
    }>;
}

export default function RecruitingShowcaseScreen({ navigation, route }: any) {
    const [data, setData] = useState<RecruitingData | null>(null);
    const [loading, setLoading] = useState(true);
    const orgId = route.params?.orgId;

    useEffect(() => {
        loadRecruitingData();
    }, []);

    const loadRecruitingData = async () => {
        try {
            const response = await axios.get(`/api/organization/${orgId}/recruiting`);
            setData(response.data);
        } catch (error) {
            console.error('Error loading recruiting data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join ${data?.companyName}! View our story: https://lifeline.app/companies/${orgId}/recruiting`,
                title: `Careers at ${data?.companyName}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (!data) return null;

    return (
        <ScrollView style={styles.container}>
            {/* Hero Header */}
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.hero}>
                {data.logoUrl && (
                    <Image source={{ uri: data.logoUrl }} style={styles.logo} />
                )}
                <Text style={styles.companyName}>{data.companyName}</Text>
                <Text style={styles.tagline}>{data.tagline}</Text>

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
            </LinearGradient>

            {/* Culture Highlights */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Our Culture</Text>
                {data.cultureHighlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightCard}>
                        {highlight.imageUrl && (
                            <Image
                                source={{ uri: highlight.imageUrl }}
                                style={styles.highlightImage}
                            />
                        )}
                        <Text style={styles.highlightTitle}>{highlight.title}</Text>
                        <Text style={styles.highlightDescription}>{highlight.description}</Text>
                    </View>
                ))}
            </View>

            {/* Company Timeline */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Our Journey</Text>
                {data.timeline.map((event, index) => (
                    <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineDate}>
                                {new Date(event.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </Text>
                            <Text style={styles.timelineTitle}>{event.title}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Career Paths */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Career Opportunities</Text>
                {data.careerPaths.map((path, index) => (
                    <View key={index} style={styles.pathCard}>
                        <Ionicons name="briefcase" size={24} color="#6366F1" />
                        <View style={styles.pathContent}>
                            <Text style={styles.pathRole}>{path.role}</Text>
                            <Text style={styles.pathDescription}>{path.description}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* CTA */}
            <View style={styles.ctaSection}>
                <Text style={styles.ctaTitle}>Ready to Join Us?</Text>
                <Text style={styles.ctaText}>
                    Be part of our story and help shape the future.
                </Text>
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => {
                        /* Open careers page or contact form */
                    }}
                >
                    <Text style={styles.ctaButtonText}>View Open Positions</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    hero: {
        padding: 40,
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    companyName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    tagline: {
        fontSize: 16,
        color: '#E0E7FF',
        textAlign: 'center',
        marginTop: 8,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    shareButtonText: {
        color: '#FFFFFF',
        marginLeft: 8,
        fontWeight: '600',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    highlightCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    highlightImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginBottom: 12,
    },
    highlightTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    highlightDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#6366F1',
        marginTop: 4,
        marginRight: 12,
    },
    timelineContent: {
        flex: 1,
    },
    timelineDate: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    timelineTitle: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    pathCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    pathContent: {
        flex: 1,
        marginLeft: 12,
    },
    pathRole: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    pathDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    ctaSection: {
        backgroundColor: '#EEF2FF',
        padding: 32,
        alignItems: 'center',
        marginTop: 20,
    },
    ctaTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    ctaText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
});
