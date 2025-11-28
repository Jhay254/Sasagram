import prisma from '../db/prisma';
import Stripe from 'stripe';
import { addDays } from 'date-fns';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});

/**
 * Organization Service - Multi-tenant enterprise accounts
 * Features: 30-day trial, annual upfront billing, auto-upgrade
 */
export class OrganizationService {
    /**
     * Create new organization (starts 30-day trial)
     */
    static async createOrganization(data: {
        companyName: string;
        billingEmail: string;
        subscriptionTier: string;
        createdBy: string;
        industry?: string;
        size?: string;
        website?: string;
    }) {
        // Generate unique slug
        const slug = this.generateSlug(data.companyName);

        // Get tier limits and features
        const tierConfig = this.getTierConfig(data.subscriptionTier);

        // Create Stripe customer
        const stripeCustomer = await stripe.customers.create({
            email: data.billingEmail,
            name: data.companyName,
            metadata: {
                tier: data.subscriptionTier,
            },
        });

        // Calculate trial end (30 days)
        const trialEndsAt = addDays(new Date(), 30);

        // Create organization
        const org = await prisma.organization.create({
            data: {
                companyName: data.companyName,
                slug,
                industry: data.industry,
                size: data.size,
                website: data.website,
                billingEmail: data.billingEmail,
                subscriptionTier: data.subscriptionTier,
                subscriptionStatus: 'TRIAL',
                stripeCustomerId: stripeCustomer.id,
                trialEndsAt,
                maxUsers: tierConfig.maxUsers,
                currentUsers: 1, // Creator
                autoUpgrade: true,
                features: tierConfig.features,
                dataRetentionMonths: null, // Unlimited by default
            },
        });

        // Add creator as admin
        await prisma.organizationMembership.create({
            data: {
                organizationId: org.id,
                userId: data.createdBy,
                role: 'ADMIN',
                status: 'ACTIVE',
                joinedAt: new Date(),
                permissions: this.getRolePermissions('ADMIN'),
            },
        });

        return org;
    }

    /**
     * Invite member to organization
     */
    static async inviteMember(
        orgId: string,
        email: string,
        role: string,
        invitedBy: string
    ) {
        const org = await prisma.organization.findUnique({ where: { id: orgId } });

        if (!org) {
            throw new Error('Organization not found');
        }

        // Check if auto-upgrade needed
        if (org.currentUsers >= org.maxUsers) {
            if (org.autoUpgrade) {
                await this.autoUpgradeToNextTier(orgId);
            } else {
                throw new Error(`User limit reached (${org.maxUsers} max for ${org.subscriptionTier} tier)`);
            }
        }

        // Find or create user by email
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Create placeholder user (will complete signup via invitation)
            user = await prisma.user.create({
                data: {
                    email,
                    name: email.split('@')[0],
                    password: '', // Will set during invitation acceptance
                    status: 'PENDING',
                },
            });
        }

        // Create membership invitation
        const membership = await prisma.organizationMembership.create({
            data: {
                organizationId: orgId,
                userId: user.id,
                role,
                status: 'INVITED',
                invitedBy,
                permissions: this.getRolePermissions(role),
            },
        });

        // Send invitation email
        // TODO: Implement email service
        console.log(`Invitation sent to ${email} for organization ${org.companyName}`);

        return membership;
    }

    /**
     * Auto-upgrade to next tier when user limit reached
     */
    static async autoUpgradeToNextTier(orgId: string) {
        const org = await prisma.organization.findUnique({ where: { id: orgId } });

        if (!org) throw new Error('Organization not found');

        const upgradePath: Record<string, string> = {
            STARTER: 'PROFESSIONAL',
            PROFESSIONAL: 'ENTERPRISE',
            ENTERPRISE: 'ENTERPRISE_PLUS',
        };

        const nextTier = upgradePath[org.subscriptionTier];

        if (!nextTier) {
            throw new Error('Already at maximum tier');
        }

        const tierConfig = this.getTierConfig(nextTier);

        // Update subscription in Stripe
        if (org.stripeSubscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
            await stripe.subscriptions.update(org.stripeSubscriptionId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: tierConfig.stripePriceId,
                    },
                ],
            });
        }

        // Update organization
        await prisma.organization.update({
            where: { id: orgId },
            data: {
                subscriptionTier: nextTier,
                maxUsers: tierConfig.maxUsers,
                features: tierConfig.features,
            },
        });

        console.log(`Organization ${org.companyName} auto-upgraded to ${nextTier}`);
    }

    /**
     * Check if user has permission in organization
     */
    static async hasPermission(userId: string, orgId: string, permission: string): Promise<boolean> {
        const membership = await prisma.organizationMembership.findUnique({
            where: {
                organizationId_userId: { organizationId: orgId, userId },
            },
        });

        if (!membership || membership.status !== 'ACTIVE') {
            return false;
        }

        const rolePermissions = this.getRolePermissions(membership.role);
        return rolePermissions[permission] === true;
    }

    /**
     * Get organization members
     */
    static async getMembers(orgId: string) {
        return await prisma.organizationMembership.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }

    // ========== Private Helper Methods ==========

    private static generateSlug(companyName: string): string {
        return companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private static getTierConfig(tier: string): any {
        const configs: Record<string, any> = {
            STARTER: {
                maxUsers: 10,
                price: 10000, // $10k/year
                stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
                features: {
                    integrations: ['SLACK_OR_GITHUB'], // Only 1
                    modules: ['RECRUITING'],
                    timeline: 'BASIC',
                    support: 'EMAIL',
                    branding: false,
                    api: false,
                },
            },
            PROFESSIONAL: {
                maxUsers: 50,
                price: 25000, // $25k/year
                stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
                features: {
                    integrations: ['SLACK', 'GITHUB', 'GOOGLE'],
                    modules: ['RECRUITING', 'INVESTOR_RELATIONS'],
                    timeline: 'ADVANCED',
                    support: 'PRIORITY',
                    branding: true,
                    api: false,
                },
            },
            ENTERPRISE: {
                maxUsers: 999999, // Unlimited
                price: 50000, // $50k/year
                stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
                features: {
                    integrations: ['ALL'],
                    modules: ['ALL'],
                    timeline: 'FULL',
                    support: 'DEDICATED',
                    branding: true,
                    api: true,
                },
            },
            ENTERPRISE_PLUS: {
                maxUsers: 999999, // Unlimited
                price: 100000, // $100k+/year (custom)
                stripePriceId: process.env.STRIPE_ENTERPRISE_PLUS_PRICE_ID,
                features: {
                    integrations: ['ALL', 'CUSTOM'], // Custom integrations
                    modules: ['ALL'],
                    timeline: 'FULL',
                    support: 'DEDICATED_24_7',
                    branding: true,
                    api: true,
                    whiteLabel: true,
                    onPremise: true,
                },
            },
        };

        return configs[tier] || configs.STARTER;
    }

    private static getRolePermissions(role: string): Record<string, boolean> {
        const permissions: Record<string, Record<string, boolean>> = {
            ADMIN: {
                manage_org: true,
                invite_users: true,
                manage_roles: true,
                edit_timeline: true,
                view_timeline: true,
                manage_integrations: true,
                edit_recruiting: true,
                edit_investor_relations: true,
                view_analytics: true,
            },
            EDITOR: {
                manage_org: false,
                invite_users: false,
                manage_roles: false,
                edit_timeline: true,
                view_timeline: true,
                manage_integrations: false,
                edit_recruiting: true,
                edit_investor_relations: true,
                view_analytics: true,
            },
            VIEWER: {
                manage_org: false,
                invite_users: false,
                manage_roles: false,
                edit_timeline: false,
                view_timeline: true,
                manage_integrations: false,
                edit_recruiting: false,
                edit_investor_relations: false,
                view_analytics: false,
            },
            RECRUITER: {
                manage_org: false,
                invite_users: false,
                manage_roles: false,
                edit_timeline: false,
                view_timeline: true,
                manage_integrations: false,
                edit_recruiting: true,
                edit_investor_relations: false,
                view_analytics: false,
            },
            IR_MANAGER: {
                manage_org: false,
                invite_users: false,
                manage_roles: false,
                edit_timeline: false,
                view_timeline: true,
                manage_integrations: false,
                edit_recruiting: false,
                edit_investor_relations: true,
                view_analytics: true,
            },
        };

        return permissions[role] || permissions.VIEWER;
    }
}
