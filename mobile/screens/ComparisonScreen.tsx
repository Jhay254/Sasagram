import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ComparisonScreen() {
    const { accessToken } = useAuth();
    const [pastDate, setPastDate] = useState(new Date());
    const [presentDate, setPresentDate] = useState(new Date());
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [showPastPicker, setShowPastPicker] = useState(false);

    const generateComparison = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/rewind/comparison', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    pastDate: format(pastDate, 'yyyy-MM-dd'),
                    presentDate: format(presentDate, 'yyyy-MM-dd'),
                }),
            });
            const data = await response.json();
            setComparison(data);
        } catch (error) {
            console.error('Error generating comparison:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Past vs. Present</Text>
                <Text style={styles.headerSubtitle}>Compare your life across time</Text>
            </View>

            {/* Date Selectors */}
            <View style={styles.dateSelectors}>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowPastPicker(true)}
                >
                    <Text style={styles.dateLabel}>Past</Text>
                    <Text style={styles.dateValue}>{format(pastDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>

                <Ionicons name="arrow-forward" size={24} color="#666" style={styles.arrow} />

                <View style={styles.dateButton}>
                    <Text style={styles.dateLabel}>Present</Text>
                    <Text style={styles.dateValue}>{format(presentDate, 'MMM d, yyyy')}</Text>
                </View>
            </View>

            {showPastPicker && (
                <DateTimePicker
                    value={pastDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowPastPicker(false);
                        if (selectedDate) {
                            setPastDate(selectedDate);
                        }
                    }}
                    maximumDate={new Date()}
                />
            )}

            <TouchableOpacity
                style={styles.compareButton}
                onPress={generateComparison}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="git-compare" size={20} color="#FFF" />
                        <Text style={styles.compareButtonText}>Compare</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Comparison Results */}
            {comparison && (
                <View style={styles.results}>
                    {/* Side-by-side comparison */}
                    <View style={styles.comparisonRow}>
                        <View style={[styles.comparisonColumn, styles.pastColumn]}>
                            <Text style={styles.columnTitle}>Past</Text>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{comparison.past.postCount}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{comparison.past.photoCount}</Text>
                                <Text style={styles.statLabel}>Photos</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{comparison.past.eventCount}</Text>
                                <Text style={styles.statLabel}>Events</Text>
                            </View>
                            {comparison.past.location && (
                                <View style={styles.locationStat}>
                                    <Text style={styles.locationText}>
                                        📍 {comparison.past.location.city}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={[styles.comparisonColumn, styles.presentColumn]}>
                            <Text style={styles.columnTitle}>Present</Text>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{comparison.present.postCount}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{comparison.present.photoCount}</Text>
                                <Text style={styles.statLabel}>Photos</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{comparison.present.eventCount}</Text>
                                <Text style={styles.statLabel}>Events</Text>
                            </View>
                            {comparison.present.location && (
                                <View style={styles.locationStat}>
                                    <Text style={styles.locationText}>
                                        📍 {comparison.present.location.city}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Insights */}
                    <View style={styles.insights}>
                        <Text style={styles.insightsTitle}>Insights</Text>

                        {comparison.comparison.locationChanged && (
                            <View style={styles.insight}>
                                <Ionicons name="location" size={20} color="#FFC107" />
                                <Text style={styles.insightText}>
                                    You've moved from {comparison.past.location?.city} to{' '}
                                    {comparison.present.location?.city}
                                </Text>
                            </View>
                        )}

                        {comparison.comparison.activityChange !== 0 && (
                            <View style={styles.insight}>
                                <Ionicons
                                    name={comparison.comparison.activityChange > 0 ? 'trending-up' : 'trending-down'}
                                    size={20}
                                    color={comparison.comparison.activityChange > 0 ? '#4CAF50' : '#F44336'}
                                />
                                <Text style={styles.insightText}>
                                    Your social posting is{' '}
                                    {comparison.comparison.activityChange > 0 ? 'up' : 'down'} by{' '}
                                    {Math.abs(comparison.comparison.activityChange)} posts
                                </Text>
                            </View>
                        )}

                        {comparison.comparison.moodDifference !== 0 && (
                            <View style={styles.insight}>
                                <Ionicons name="happy" size={20} color="#2196F3" />
                                <Text style={styles.insightText}>
                                    Your mood has{' '}
                                    {comparison.comparison.moodDifference > 0 ? 'improved' : 'declined'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        padding: 20,
        backgroundColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#999',
        marginTop: 4,
    },
    dateSelectors: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    dateButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
    arrow: {
        marginHorizontal: 12,
    },
    compareButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        margin: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    compareButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    results: {
        padding: 20,
    },
    comparisonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    comparisonColumn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
    },
    pastColumn: {
        backgroundColor: '#1a1a1a',
    },
    presentColumn: {
        backgroundColor: '#1a1a1a',
    },
    columnTitle: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    stat: {
        marginBottom: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        color: '#007AFF',
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
        color: '#999',
    },
    locationStat: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    locationText: {
        fontSize: 14,
        color: '#FFF',
        textAlign: 'center',
    },
    insights: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    insightsTitle: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 16,
    },
    insight: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    insightText: {
        fontSize: 14,
        color: '#FFF',
        marginLeft: 12,
        flex: 1,
    },
});
