import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CollaborationCardProps {
    mergedChapter: {
        id: string;
        title: string;
        status: string;
        creatorA: { name: string };
        creatorB: { name: string };
        revenueSplitRatio: number;
        totalEarnings: number;
    };
    onPress?: () => void;
}

export default function CollaborationCard({ mergedChapter, onPress }: CollaborationCardProps) {
    const { creatorA, creatorB, status, title, revenueSplitRatio, totalEarnings } = mergedChapter;

    const statusColor = {
        DRAFT: '#FFC107',
        PENDING_APPROVAL: '#2196F3',
        PUBLISHED: '#4CAF50',
        ARCHIVED: '#666',
    }[status] || '#666';

    const splitA = Math.round(revenueSplitRatio * 100);
    const splitB = 100 - splitA;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            </View>

            <Text style={styles.title}>{title}</Text>

            <View style={styles.collaborators}>
                <View style={styles.collaborator}>
                    <Ionicons name="person" size={16} color="#007AFF" />
                    <Text style={styles.collaboratorName}>{creatorA.name}</Text>
                    <Text style={styles.split}>{splitA}%</Text>
                </View>

                <Ionicons name="add" size={20} color="#666" />

                <View style={styles.collaborator}>
                    <Ionicons name="person" size={16} color="#FF6B6B" />
                    <Text style={styles.collaboratorName}>{creatorB.name}</Text>
                    <Text style={styles.split}>{splitB}%</Text>
                </View>
            </View>

            {totalEarnings > 0 && (
                <View style={styles.earnings}>
                    <Ionicons name="cash" size={16} color="#4CAF50" />
                    <Text style={styles.earningsText}>${totalEarnings.toFixed(2)} earned</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    header: {
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    collaborators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    collaborator: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    collaboratorName: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 8,
    },
    split: {
        color: '#666',
        fontSize: 12,
        marginLeft: 4,
    },
    earnings: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    earningsText: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});
