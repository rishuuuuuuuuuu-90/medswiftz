import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';

export const getDashboardMetrics = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ordersToday, pendingRx, activeDeliveries,
      totalRevenue, totalUsers, lowStock,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.prescription.count({ where: { status: 'PENDING' } }),
      prisma.deliveryTask.count({ where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP'] } } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.inventory.count({ where: { stock: { lte: 10 } } }),
    ]);

    res.json({
      success: true, message: 'Dashboard metrics',
      data: {
        ordersToday, pendingRx, activeDeliveries,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalUsers, lowStock,
      },
    });
  } catch (err) { next(err); }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    const users = await prisma.user.findMany({
      where, skip, take: Number(limit),
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, message: 'Users fetched', data: users });
  } catch (err) { next(err); }
};

export const getDeliveryPartners = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const partners = await prisma.user.findMany({
      where: { role: 'DELIVERY_PARTNER', isActive: true },
      select: { id: true, name: true, phone: true, email: true },
    });
    res.json({ success: true, message: 'Partners fetched', data: partners });
  } catch (err) { next(err); }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('User not found', 404);
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });
    res.json({ success: true, message: `User ${updated.isActive ? 'activated' : 'deactivated'}`, data: { isActive: updated.isActive } });
  } catch (err) { next(err); }
};

export const getAuditLogs = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, message: 'Audit logs fetched', data: logs });
  } catch (err) { next(err); }
};
