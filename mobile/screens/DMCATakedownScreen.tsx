import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DMCATakedownScreen({ navigation }: any) {
    const [formData, setFormData] = useState({
        requesterName: '',
        requesterEmail: '',
        infringingUrl: '',
        originalWork: '',
        copyrightOwner: '',
        registrationNumber: '',
        description: '',
        evidenceUrls: [''],
    });
    const [submitting, setSubmitting] = useState(false);

    const updateField = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const addEvidenceUrl = () => {
        setFormData({
            ...formData,
            evidenceUrls: [...formData.evidenceUrls, ''],
        });
    };

    const updateEvidenceUrl = (index: number, value: string) => {
        const newUrls = [...formData.evidenceUrls];
        newUrls[index] = value;
        setFormData({ ...formData, evidenceUrls: newUrls });
    };

    const submitTakedown = async () => {
        // Validate
        if (!formData.requesterName || !formData.requesterEmail || !formData.infringingUrl) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        // Confirm submission
        Alert.alert(
            'Confirm DMCA Takedown',
            'By submitting this request, you certify under penalty of perjury that the information is accurate. The content will be removed automatically upon submission.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Submit',
                    style: 'destructive',
                    onPress: async () => {
                        setSubmitting(true);
                        try {
                            // Get authentication token
                            const token = await AsyncStorage.getItem('accessToken');
                            if (!token) {
                                Alert.alert('Error', 'Authentication required');
                                setSubmitting(false);
                                return;
                            }

                            const response = await fetch('/api/dmca/takedown', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    ...formData,
                                    evidenceUrls: formData.evidenceUrls.filter((url) => url.trim()),
                                    signatureData: {
                                        timestamp: new Date().toISOString(),
                                        ipAddress: '0.0.0.0',
                                    },
                                }),
                            });

                            if (response.ok) {
                                Alert.alert(
                                    'Success',
                                    'DMCA takedown request submitted. Content will be processed automatically.',
                                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                                );
                            } else {
                                const error = await response.json();
                                Alert.alert('Error', error.error || 'Failed to submit request');
                            }
                        } catch (error) {
                            console.error('Error submitting takedown:', error);
                            Alert.alert('Error', 'Failed to submit request');
                        } finally {
                            setSubmitting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>DMCA Takedown</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.warningBanner}>
                <Ionicons name="alert-circle" size={20} color="#F44336" />
                <Text style={styles.warningText}>
                    Content will be removed automatically upon submission
                </Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Information</Text>

                    <Text style={styles.label}>
                        Full Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={formData.requesterName}
                        onChangeText={(value) => updateField('requesterName', value)}
                        placeholder="John Doe"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.label}>
                        Email <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={formData.requesterEmail}
                        onChangeText={(value) => updateField('requesterEmail', value)}
                        placeholder="john@example.com"
                        placeholderTextColor="#666"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Copyright Claim</Text>

                    <Text style={styles.label}>
                        Infringing URL <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={formData.infringingUrl}
                        onChangeText={(value) => updateField('infringingUrl', value)}
                        placeholder="https://example.com/content/123"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>
                        Original Work Description <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.originalWork}
                        onChangeText={(value) => updateField('originalWork', value)}
                        placeholder="Describe your original work"
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.label}>
                        Copyright Owner <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={formData.copyrightOwner}
                        onChangeText={(value) => updateField('copyrightOwner', value)}
                        placeholder="Company or individual name"
                        placeholderTextColor="#666"
                    />

                    <Text style={styles.label}>Copyright Registration Number (if any)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.registrationNumber}
                        onChangeText={(value) => updateField('registrationNumber', value)}
                        placeholder="Optional"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Evidence URLs</Text>
                    {formData.evidenceUrls.map((url, index) => (
                        <TextInput
                            key={index}
                            style={styles.input}
                            value={url}
                            onChangeText={(value) => updateEvidenceUrl(index, value)}
                            placeholder={`Evidence URL ${index + 1}`}
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                        />
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={addEvidenceUrl}>
                        <Ionicons name="add" size={16} color="#007AFF" />
                        <Text style={styles.addButtonText}>Add Another URL</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>
                        Detailed Description <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(value) => updateField('description', value)}
                        placeholder="Explain the infringement in detail"
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={5}
                    />
                </View>

                <View style={styles.legalNotice}>
                    <Text style={styles.legalTitle}>Legal Statement</Text>
                    <Text style={styles.legalText}>
                        I certify under penalty of perjury that I am the copyright owner or authorized to act on behalf of the owner, and that the information in this notification is accurate.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={submitTakedown}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Submitting...' : 'Submit DMCA Takedown Request'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
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
        fontSize: 18,
        fontWeight: '600',
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4433620',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F44336',
    },
    warningText: {
        color: '#F44336',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    label: {
        color: '#FFF',
        fontSize: 14,
        marginBottom: 8,
    },
    required: {
        color: '#F44336',
    },
    input: {
        backgroundColor: '#1a1a1a',
        color: '#FFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF20',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    addButtonText: {
        color: '#007AFF',
        fontSize: 14,
        marginLeft: 8,
    },
    legalNotice: {
        backgroundColor: '#1a1a1a',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F44336',
    },
    legalTitle: {
        color: '#F44336',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    legalText: {
        color: '#F44336',
        fontSize: 12,
        lineHeight: 18,
    },
    submitButton: {
        backgroundColor: '#F44336',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#666',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
