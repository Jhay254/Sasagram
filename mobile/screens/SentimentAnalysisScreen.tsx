import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function SentimentAnalysisScreen({ navigation }: any) {
    const [timeline, setTimeline] = useState<any[]>([]);
    const [mentions, setMentions] = useState<any[]>([]);
    const [filter, setFilter] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        const params = filter ? { source: filter } : {};
        const [timelineRes, mentionsRes] = await Promise.all([
            axios.get('/api/celebrity/sentiment/timeline', { params }),
            axios.get('/api/celebrity/sentiment/mentions', { params }),
        ]);
        setTimeline(timelineRes.data);
        setMentions(mentionsRes.data);
    };

    const chartData = {
        labels: timeline.slice(-7).map((d) => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{ data: timeline.slice(-7).map((d) => d.score) }],
    };

    const renderMention = ({ item }: any) => (
        <View style={styles.mentionCard}>
            <View style={styles.mentionHeader}>
                <Ionicons name={item.source === 'TWITTER' ? 'logo-twitter' : 'newspaper'} size={20} color="#6366F1" />
                <Text style={styles.mentionSource}>{item.source}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: item.sentimentScore > 0 ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={{ color: item.sentimentScore > 0 ? '#059669' : '#DC2626', fontSize: 12, fontWeight: '600' }}>
                        {(item.sentimentScore * 100).toFixed(0)}%
                    </Text>
                </View>
            </View>
            <Text style={styles.mentionText}>{item.snippet}</Text>
            <Text style={styles.mentionDate}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Sentiment Trend (7 Days)</Text>
                {timeline.length > 0 && (
                    <LineChart
                        data={chartData}
                        width={width - 40}
                        height={200}
                        chartConfig={{
                            backgroundColor: '#6366F1',
                            backgroundGradientFrom: '#6366F1',
                            backgroundGradientTo: '#8B5CF6',
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            style: { borderRadius: 16 },
                        }}
                        bezier
                        style={styles.chart}
                    />
                )}
            </View>

            <View style={styles.filtersContainer}>
                {['ALL', 'TWITTER', 'NEWS', 'INSTAGRAM'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, filter === (f === 'ALL' ? null : f) && styles.filterChipActive]}
                        onPress={() => setFilter(f === 'ALL' ? null : f)}
                    >
                        <Text style={[styles.filterText, filter === (f === 'ALL' ? null : f) && styles.filterTextActive]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={mentions}
                renderItem={renderMention}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    chartContainer: { backgroundColor: '#FFFFFF', padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
    chart: { borderRadius: 16 },
    filtersContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
    filterChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    filterText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    filterTextActive: { color: '#FFFFFF' },
    listContainer: { paddingHorizontal: 16 },
    mentionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
    mentionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    mentionSource: { fontSize: 13, fontWeight: '600', color: '#6B7280', flex: 1 },
    scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    mentionText: { fontSize: 14, color: '#111827', marginBottom: 8 },
    mentionDate: { fontSize: 12, color: '#9CA3AF' },
});
