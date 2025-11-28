import { Request, Response } from 'express';
import { AudioInterrogatorService } from '../services/audio-interrogator.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import multer from 'multer';

// Configure multer for audio uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files allowed'));
        }
    },
});

export class AudioInterrogatorController {
    static uploadMiddleware = upload.single('audio');

    /**
     * Start interrogation session
     */
    static async startSession(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { location, recentActivity, mood } = req.body;

            const session = await AudioInterrogatorService.startSession(userId, {
                location,
                recentActivity,
                mood,
            });

            res.json({ success: true, session });
        } catch (error: any) {
            if (error.message === 'Audio Interrogator feature not available') {
                return res.status(403).json({
                    success: false,
                    error: 'Feature not available',
                    comingSoon: true,
                });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get current session
     */
    static async getSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;

            const session = await prisma.interrogationSession.findUnique({
                where: { id: sessionId },
                include: {
                    questions: {
                        orderBy: { askedAt: 'asc' },
                    },
                    audioEntries: true,
                },
            });

            res.json({ success: true, session });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Submit audio response
     */
    static async submitAudioResponse(req: Request, res: Response) {
        try {
            const { questionId } = req.params;
            const audioFile = req.file;

            if (!audioFile) {
                return res.status(400).json({ success: false, error: 'No audio file provided' });
            }

            const result = await AudioInterrogatorService.processAudioResponse(questionId, {
                buffer: audioFile.buffer,
                filename: audioFile.originalname,
                mimetype: audioFile.mimetype,
            });

            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get user's audio diary entries
     */
    static async getDiaryEntries(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { emotionTone, dateFrom, dateTo } = req.query;

            const entries = await AudioInterrogatorService.getUserEntries(userId, {
                emotionTone: emotionTone as string,
                dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
                dateTo: dateTo ? new Date(dateTo as string) : undefined,
            });

            res.json({ success: true, entries });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Check feature status
     */
    static async checkFeatureStatus(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            const isEnabled = await FeatureFlagService.isEnabled('FEATURE_AUDIO_INTERROGATOR', userId);

            res.json({
                success: true,
                enabled: isEnabled,
                featureName: 'FEATURE_AUDIO_INTERROGATOR',
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
