import prisma from '../db/prisma';
import { FeatureFlagService } from './feature-flag.service';
import axios from 'axios';
// import OpenAI from 'openai'; // For GPT-4 question generation
// import FormData from 'form-data';

/**
 * Audio Interrogator Service - AI Voice Diary Assistant
 * Feature: FEATURE_AUDIO_INTERROGATOR (disabled by default)
 * 
 * Uses:
 * - OpenAI Whisper for transcription
 * - GPT-4 for context-aware question generation
 * - Emotion detection from voice tone
 */
export class AudioInterrogatorService {
    /**
     * Start a new interrogation session
     */
    static async startSession(userId: string, context?: {
        location?: string;
        recentActivity?: string;
        mood?: string;
    }) {
        // Check feature flag
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_AUDIO_INTERROGATOR', userId);
        if (!isEnabled) {
            throw new Error('Audio Interrogator feature not available');
        }

        const session = await prisma.interrogationSession.create({
            data: {
                userId,
                context: context || {},
                status: 'ACTIVE',
            },
        });

        // Generate first question based on context
        await this.generateNextQuestion(session.id, context);

        return session;
    }

    /**
     * Generate context-aware question
     */
    static async generateNextQuestion(sessionId: string, context?: any) {
        const session = await prisma.interrogationSession.findUnique({
            where: { id: sessionId },
            include: {
                questions: true,
                user: true,
            },
        });

        if (!session) {
            throw new Error('Session not found');
        }

        // Analyze context to generate relevant question
        const questionText = await this.generateQuestionFromContext(session, context);

        const question = await prisma.interrogationQuestion.create({
            data: {
                sessionId,
                questionText,
                questionType: this.classifyQuestionType(questionText),
                generatedBy: 'CONTEXT_BASED',
                contextUsed: context,
            },
        });

        return question;
    }

    /**
     * Process audio response from user
     */
    static async processAudioResponse(
        questionId: string,
        audioFile: {
            buffer: Buffer;
            filename: string;
            mimetype: string;
        }
    ) {
        const question = await prisma.interrogationQuestion.findUnique({
            where: { id: questionId },
            include: { session: true },
        });

        if (!question) {
            throw new Error('Question not found');
        }

        // 1. Upload audio to storage
        const audioUrl = await this.uploadAudio(audioFile);

        // 2. Transcribe with Whisper
        const transcription = await this.transcribeAudio(audioFile.buffer);

        // 3. Detect emotion from audio
        const emotion = await this.detectEmotion(audioFile.buffer, transcription.text);

        // 4. Save audio diary entry
        const entry = await prisma.audioDiaryEntry.create({
            data: {
                userId: question.session.userId,
                sessionId: question.sessionId,
                audioUrl,
                duration: Math.round(transcription.duration || 0),
                transcription: transcription.text,
                language: transcription.language,
                emotionTone: emotion.tone,
                emotionScore: emotion.score,
                triggeredBy: 'INTERROGATION',
            },
        });

        // 5. Update question as answered
        await prisma.interrogationQuestion.update({
            where: { id: questionId },
            data: {
                answered: true,
                answerText: transcription.text,
                answerAudioUrl: audioUrl,
                answeredAt: new Date(),
            },
        });

        // 6. Generate follow-up if needed
        if (this.needsFollowUp(transcription.text, emotion)) {
            await this.generateFollowUpQuestion(questionId, transcription.text, emotion);
        }

        return { entry, transcription, emotion };
    }

    /**
     * Trigger location-based interrogation
     */
    static async triggerLocationPrompt(userId: string, location: {
        latitude: number;
        longitude: number;
        placeName?: string;
    }) {
        const isEnabled = await FeatureFlagService.isEnabled('FEATURE_AUDIO_INTERROGATOR', userId);
        if (!isEnabled) return null;

        // Check if this is a significant/unusual location
        const isSignificant = await this.isSignificantLocation(userId, location);
        if (!isSignificant) return null;

        // Start interrogation session
        const session = await this.startSession(userId, {
            location: location.placeName || `${location.latitude},${location.longitude}`,
        });

        return session;
    }

    /**
     * Get user's audio diary entries
     */
    static async getUserEntries(userId: string, filters?: {
        emotionTone?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }) {
        return await prisma.audioDiaryEntry.findMany({
            where: {
                userId,
                ...(filters?.emotionTone && { emotionTone: filters.emotionTone }),
                ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
                ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                session: {
                    include: {
                        questions: true,
                    },
                },
            },
        });
    }

    // ========== Private Helper Methods ==========

    /**
     * Generate question from context using AI
     */
    private static async generateQuestionFromContext(session: any, context: any): Promise<string> {
        // Simplified version - production would use GPT-4

        if (context?.location) {
            return `You've been at ${context.location} for a while. What brings you here today?`;
        }

        if (context?.mood === 'STRESSED') {
            return `You seem stressed. What's on your mind right now?`;
        }

        if (session.questions.length === 0) {
            return "How are you feeling today?";
        }

        // Follow-up based on previous answers
        const lastAnswer = session.questions[session.questions.length - 1]?.answerText;
        if (lastAnswer && lastAnswer.includes('work')) {
            return "Tell me more about what's happening at work.";
        }

        return "What else would you like to share?";
    }

    /**
     * Classify question type
     */
    private static classifyQuestionType(questionText: string): string {
        if (questionText.toLowerCase().includes('feel') || questionText.toLowerCase().includes('emotion')) {
            return 'EMOTIONAL';
        }
        if (questionText.toLowerCase().includes('tell me more') || questionText.toLowerCase().includes('why')) {
            return 'PROBING';
        }
        if (questionText.toLowerCase().includes('what') || questionText.toLowerCase().includes('when')) {
            return 'FACTUAL';
        }
        return 'CLARIFYING';
    }

    /**
     * Transcribe audio using Whisper
     */
    private static async transcribeAudio(audioBuffer: Buffer): Promise<{
        text: string;
        language?: string;
        duration?: number;
    }> {
        try {
            // Production: Use OpenAI Whisper API
            // const formData = new FormData();
            // formData.append('file', audioBuffer, 'audio.m4a');
            // formData.append('model', 'whisper-1');
            // 
            // const response = await openai.audio.transcriptions.create({
            //   file: formData,
            //   model: 'whisper-1',
            // });
            // 
            // return {
            //   text: response.text,
            //   language: response.language,
            //   duration: response.duration,
            // };

            // MVP: Return mock transcription
            return {
                text: '[Audio transcription will appear here]',
                language: 'en',
                duration: 30,
            };
        } catch (error) {
            console.error('Transcription error:', error);
            return {
                text: '[Transcription failed]',
            };
        }
    }

    /**
     * Detect emotion from audio
     */
    private static async detectEmotion(audioBuffer: Buffer, transcription: string): Promise<{
        tone: string;
        score: number;
    }> {
        // Production: Use voice emotion detection API
        // Could analyze:
        // - Pitch variation
        // - Speech rate
        // - Volume
        // - Transcription sentiment

        // MVP: Simple sentiment from transcription
        const lowerText = transcription.toLowerCase();

        if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('excited')) {
            return { tone: 'HAPPY', score: 0.8 };
        }
        if (lowerText.includes('sad') || lowerText.includes('upset') || lowerText.includes('disappointed')) {
            return { tone: 'SAD', score: 0.7 };
        }
        if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('annoyed')) {
            return { tone: 'ANGRY', score: 0.75 };
        }
        if (lowerText.includes('stress') || lowerText.includes('worried') || lowerText.includes('anxious')) {
            return { tone: 'STRESSED', score: 0.7 };
        }

        return { tone: 'NEUTRAL', score: 0.5 };
    }

    /**
     * Check if follow-up needed
     */
    private static needsFollowUp(answerText: string, emotion: any): boolean {
        // Trigger follow-up if:
        // - Answer is very short (vague)
        // - Strong negative emotion
        // - Inconsistency with previous answers

        if (answerText.split(' ').length < 5) {
            return true; // Too vague
        }

        if (emotion.tone === 'STRESSED' || emotion.tone === 'SAD') {
            return true; // Explore negative emotions
        }

        return false;
    }

    /**
     * Generate follow-up question
     */
    private static async generateFollowUpQuestion(
        originalQuestionId: string,
        answerText: string,
        emotion: any
    ) {
        const question = await prisma.interrogationQuestion.findUnique({
            where: { id: originalQuestionId },
        });

        if (!question) return;

        // Generate contextual follow-up
        let followUpText = '';

        if (answerText.split(' ').length < 5) {
            followUpText = "Can you tell me more about that?";
        } else if (emotion.tone === 'STRESSED') {
            followUpText = "What's causing you to feel this way?";
        } else {
            followUpText = "Is there anything else you'd like to add?";
        }

        await prisma.interrogationQuestion.create({
            data: {
                sessionId: question.sessionId,
                questionText: followUpText,
                questionType: 'PROBING',
                generatedBy: 'FOLLOW_UP',
                contextUsed: { originalAnswer: answerText, emotion },
            },
        });

        await prisma.interrogationQuestion.update({
            where: { id: originalQuestionId },
            data: { triggeredFollowUp: true },
        });
    }

    /**
     * Check if location is significant
     */
    private static async isSignificantLocation(userId: string, location: any): Promise<boolean> {
        // Check if user has been here before
        const recentLocations = await prisma.location.findMany({
            where: {
                userId,
                timestamp: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
        });

        // If this is a new location (not in recent history), it's significant
        const isNew = !recentLocations.some((loc) => {
            const distance = this.calculateDistance(
                location.latitude,
                location.longitude,
                loc.latitude,
                loc.longitude
            );
            return distance < 0.1; // Within 100m = same place
        });

        return isNew;
    }

    /**
     * Calculate distance between coordinates (km)
     */
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Upload audio file to storage
     */
    private static async uploadAudio(audioFile: any): Promise<string> {
        // Production: Upload to S3 or cloud storage
        // Return URL

        // MVP: Return placeholder
        return `https://storage.lifeline.app/audio/${Date.now()}.m4a`;
    }
}
