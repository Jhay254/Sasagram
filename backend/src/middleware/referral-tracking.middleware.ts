import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

/**
 * Middleware to track referral clicks via cookies
 * Sets a cookie when a referral link is clicked
 */
export function trackReferralClick(req: Request, res: Response, next: NextFunction) {
    const { ref } = req.query;

    if (ref && typeof ref === 'string') {
        // Set referral cookie that expires in 30 days
        res.cookie('lifeline_ref', ref, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        console.log(`📍 Referral tracked: ${ref}`);
    }

    next();
}

/**
 * Get referral code from cookie
 */
export function getReferralCode(req: Request): string | null {
    return req.cookies?.lifeline_ref || null;
}

/**
 * Clear referral cookie after successful attribution
 */
export function clearReferralCookie(res: Response) {
    res.clearCookie('lifeline_ref');
}
