import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { UserRole } from '@prisma/client';

export class AdminController {
    async getStats(req: Request, res: Response) {
        try {
            const stats = await adminService.getSystemStats();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUsers(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = req.query.search as string;

            const result = await adminService.getUsers(page, limit, search);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateUserRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!Object.values(UserRole).includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            const user = await adminService.updateUserRole(id, role as UserRole);
            res.json(user);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const adminController = new AdminController();
