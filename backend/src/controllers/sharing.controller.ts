import { Request, Response } from 'express';
import { SharingService } from '../services/sharing.service';

/**
 * Get Open Graph metadata for biography
 */
export async function getBiographyMetadata(req: Request, res: Response) {
    try {
        const { biographyId } = req.params;

        const metadata = await SharingService.getBiographyOgMetadata(biographyId);

        res.json({
            success: true,
            data: metadata,
        });
    } catch (error: any) {
        console.error('Error getting biography metadata:', error);
        res.status(404).json({ success: false, message: error.message });
    }
}

/**
 * Get Open Graph metadata for profile
 */
export async function getProfileMetadata(req: Request, res: Response) {
    try {
        const { userId } = req.params;

        const metadata = await SharingService.getProfileOgMetadata(userId);

        res.json({
            success: true,
            data: metadata,
        });
    } catch (error: any) {
        console.error('Error getting profile metadata:', error);
        res.status(404).json({ success: false, message: error.message });
    }
}

/**
 * Generate share URLs
 */
export async function generateShareUrls(req: Request, res: Response) {
    try {
        const { type, id } = req.params;

        let url: string;
        let title: string;
        let description: string | undefined;

        if (type === 'biography') {
            const metadata = await SharingService.getBiographyOgMetadata(id);
            url = metadata.url;
            title = metadata.title;
            description = metadata.description;
        } else if (type === 'profile') {
            const metadata = await SharingService.getProfileOgMetadata(id);
            url = metadata.url;
            title = metadata.title;
            description = metadata.description;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid type' });
        }

        const shareUrls = SharingService.generateSocialShareUrls(url, title, description);
        const deepLink = SharingService.generateDeepLink(type as any, id);

        res.json({
            success: true,
            data: {
                url,
                deepLink,
                socialUrls: shareUrls,
            },
        });
    } catch (error: any) {
        console.error('Error generating share URLs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Track share
 */
export async function trackShare(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { targetType, targetId, platform } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        await SharingService.trackShare(userId, targetType, targetId, platform);

        res.json({
            success: true,
            message: 'Share tracked',
        });
    } catch (error: any) {
        console.error('Error tracking share:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
