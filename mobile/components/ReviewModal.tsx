import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    biographyId: string;
    biographyTitle: string;
    existingReview?: {
        rating: number;
        reviewText?: string;
    };
}

export default function ReviewModal({
    visible,
    onClose,
    biographyId,
    biographyTitle,
    existingReview,
}: ReviewModalProps) {
    const { theme } = useTheme();
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            // TODO: Call API
            // await fetch('/api/engagement/reviews', {
            //   method: 'POST',
            //   body: JSON.stringify({ biographyId, rating, reviewText }),
            // });

            Alert.alert('Success', 'Review submitted!', [
                { text: 'OK', onPress: onClose },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Rate & Review
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.biographyTitle, { color: theme.colors.textSecondary }]}>
                        {biographyTitle}
                    </Text>

                    {/* Star Rating */}
                    <View style={styles.ratingContainer}>
                        <Text style={[styles.ratingLabel, { color: theme.colors.text }]}>
                            Your Rating
                        </Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    style={styles.starButton}
                                >
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={40}
                                        color={star <= rating ? '#f59e0b' : theme.colors.border}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        {rating > 0 && (
                            <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                            </Text>
                        )}
                    </View>

                    {/* Review Text */}
                    <View style={styles.reviewContainer}>
                        <Text style={[styles.reviewLabel, { color: theme.colors.text }]}>
                            Write a Review (Optional)
                        </Text>
                        <TextInput
                            style={[
                                styles.reviewInput,
                                {
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.text,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                            placeholder="Share your thoughts about this biography..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            {
                                backgroundColor: rating > 0 ? theme.colors.primary : theme.colors.border,
                            },
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                    >
                        <Text style={styles.submitButtonText}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    biographyTitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    stars: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
    },
    reviewContainer: {
        marginBottom: 24,
    },
    reviewLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    reviewInput: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        minHeight: 120,
    },
    submitButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
