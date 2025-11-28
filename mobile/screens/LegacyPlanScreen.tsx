import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function LegacyPlanScreen({ navigation }: any) {
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlan();
    }, []);

    const loadPlan = async () => {
        try {
            const response = await axios.get('/api/celebrity/legacy/plan');
            setPlan(response.data);
        } catch (error) {
            console.log('No legacy plan found');
        } finally {
            setLoading(false);
        }
    };

    const createPlan = async () => {
        try {
            await axios.post('/api/celebrity/legacy/plan', {
                beneficiaries: [],
                finalMessage: '',
            });
            loadPlan();
        } catch (error) {
            Alert.alert('Error', 'Failed to create legacy plan');
        }
    };

    const schedulePost = async () => {
        Alert.alert('Schedule Post', 'Schedule posthumous content feature');
    };

    if (!plan) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Legacy Plan</Text>
                <Text style={styles.emptyText}>Create a digital will to manage your posthumous content</Text>
                <TouchableOpacity style={styles.createButton} onPress={createPlan}>
                    <Text style={styles.createButtonText}>Create Legacy Plan</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="person-circle" size={32} color="#6366F1" />
                    <View style={styles.cardHeaderText}>
                        <Text style={styles.cardTitle}>Executor</Text>
                        <Text style={styles.cardValue}>{plan.executorName || 'Not assigned'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Beneficiaries</Text>
                <Text style={styles.cardSubtext}>{plan.beneficiaries?.length || 0} beneficiaries added</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add-circle-outline" size={20} color="#6366F1" />
                    <Text style={styles.addButtonText}>Add Beneficiary</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Scheduled Posts</Text>
                <Text style={styles.cardSubtext}>{plan.scheduledPosts?.length || 0} posts scheduled</Text>
                <TouchableOpacity style={styles.addButton} onPress={schedulePost}>
                    <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                    <Text style={styles.addButtonText}>Schedule Posthumous Post</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Private Letters</Text>
                <Text style={styles.cardSubtext}>{plan.privateLetters?.length || 0} letters written</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="mail-outline" size={20} color="#10B981" />
                    <Text style={styles.addButtonText}>Write Letter</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.activationRow}>
                    <View>
                        <Text style={styles.cardTitle}>Plan Status</Text>
                        <Text style={[styles.statusText, { color: plan.isActive ? '#10B981' : '#F59E0B' }]}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.activateButton}>
                        <Text style={styles.activateButtonText}>{plan.isActive ? 'Deactivate' : 'Activate'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F9FAFB' },
    emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 16 },
    emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 },
    createButton: { backgroundColor: '#6366F1', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
    createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    card: { backgroundColor: '#FFFFFF', margin: 16, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    cardHeaderText: { marginLeft: 12, flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
    cardValue: { fontSize: 16, color: '#6B7280' },
    cardSubtext: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
    addButtonText: { marginLeft: 8, color: '#111827', fontSize: 15, fontWeight: '500' },
    activationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
    activateButton: { backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    activateButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
