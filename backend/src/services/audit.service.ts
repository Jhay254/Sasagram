import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface AuditLogEntry {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    /**
     * Create an audit log entry
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    action: entry.action,
                    resource: entry.resource,
                    resourceId: entry.resourceId,
                    details: entry.details ? JSON.stringify(entry.details) : undefined,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                },
            });
        } catch (error) {
            // We don't want audit logging to fail the request, but we should log the error
            logger.error('Failed to create audit log:', error);
        }
    }
}

export const auditService = new AuditService();
