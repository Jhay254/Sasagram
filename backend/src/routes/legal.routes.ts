import { Router, Request, Response } from 'express';
import { publicEndpointLimiter } from '../middleware/rate-limit.middleware';
import { FacebookService } from '../services/facebook.service';

const router = Router();
const facebookService = new FacebookService();

const privacyPolicy = `
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Policy - Lifeline</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p>Last updated: November 29, 2025</p>
    
    <p>Lifeline ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Lifeline.</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information you provide directly to us, such as when you create an account, connect social media profiles, or contact us for support.</p>
    <ul>
        <li><strong>Account Information:</strong> Name, email address, and password.</li>
        <li><strong>Social Media Data:</strong> When you connect accounts (Instagram, Twitter, Facebook, LinkedIn), we collect profile information and content (posts, photos) to generate your biography.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
        <li>Provide, maintain, and improve our services.</li>
        <li>Generate your personal digital biography.</li>
        <li>Send you technical notices and support messages.</li>
    </ul>

    <h2>3. Data Sharing</h2>
    <p>We do not share your personal information with third parties except as described in this policy or with your consent.</p>

    <h2>4. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us at support@lifeline.com.</p>
</body>
</html>
`;

const dataDeletion = `
<!DOCTYPE html>
<html>
<head>
    <title>Data Deletion Instructions - Lifeline</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        h1 { color: #2c3e50; }
    </style>
</head>
<body>
    <h1>User Data Deletion Instructions</h1>
    <p>In accordance with Facebook Platform rules, we provide a way for users to request deletion of their data.</p>
    
    <p>If you wish to delete your data from Lifeline, you can do so by following these steps:</p>
    <ol>
        <li>Log in to your Lifeline account.</li>
        <li>Go to <strong>Settings</strong> > <strong>Account</strong>.</li>
        <li>Click on <strong>"Delete Account"</strong>.</li>
        <li>Confirm your choice.</li>
    </ol>
    
    <p>Alternatively, you can contact us at <strong>support@lifeline.com</strong> with the subject line "Data Deletion Request", and we will process your request within 30 days.</p>
</body>
</html>
`;

router.get('/privacy', (req: Request, res: Response) => {
    res.send(privacyPolicy);
});

router.get('/data-deletion', (req: Request, res: Response) => {
    res.send(dataDeletion);
});

// Meta Data Deletion Callback
// Meta sends a POST request here when a user removes the app
router.post('/data-deletion-callback', publicEndpointLimiter, (req: Request, res: Response) => {
    try {
        const { signed_request } = req.body;

        // Verify signed request to prevent unauthorized deletion requests
        if (!signed_request) {
            return res.status(400).json({ error: 'Missing signed_request parameter' });
        }

        const verification = facebookService.verifySignedRequest(signed_request);
        if (!verification.valid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Extract user ID from verified data
        const userId = verification.data?.user_id;
        if (!userId) {
            return res.status(400).json({ error: 'Missing user_id in signed request' });
        }

        // Generate a confirmation code
        const confirmationCode = 'del_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

        // TODO: Schedule actual user data deletion in background job
        // await dataService.scheduleUserDataDeletion(userId);

        // Return the JSON response Meta expects
        res.json({
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/data-deletion-status?code=${confirmationCode}`,
            confirmation_code: confirmationCode,
        });
    } catch (error) {
        console.error('Data deletion callback error:', error);
        res.status(500).json({ error: 'Failed to process deletion request' });
    }
});

router.get('/data-deletion-status', (req: Request, res: Response) => {
    const { code } = req.query;
    res.send(`
        <html>
            <body>
                <h1>Data Deletion Status</h1>
                <p>Confirmation Code: ${code}</p>
                <p>Status: <strong>Completed</strong></p>
                <p>Your data has been scheduled for deletion.</p>
            </body>
        </html>
    `);
});

export default router;
