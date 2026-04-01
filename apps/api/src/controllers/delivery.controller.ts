import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitToRoom } from '../socket';
import { randomInt } from 'crypto';

export const getMyDeliveries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deliveries = await prisma.deliveryTask.findMany({
      where: { partnerId: req.user!.userId, status: { notIn: ['DELIVERED', 'REJECTED'] } },
      include: {
        order: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
            address: true, items: { include: { medicine: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, message: 'Deliveries fetched', data: deliveries });
  } catch (err) { next(err); }
};

export const getDeliveryByOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const delivery = await prisma.deliveryTask.findFirst({
      where: { orderId: req.params.orderId },
      include: { partner: { select: { id: true, name: true, phone: true } } },
    });
    if (!delivery) throw new AppError('Delivery task not found', 404);
    res.json({ success: true, message: 'Delivery fetched', data: delivery });
  } catch (err) { next(err); }
};

export const assignDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, partnerId } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    const partner = await prisma.user.findFirst({
      where: { id: partnerId, role: 'DELIVERY_PARTNER', isActive: true },
    });
    if (!partner) throw new AppError('Delivery partner not found', 404);

    const otp = String(randomInt(100000, 999999));
    const task = await prisma.deliveryTask.upsert({
      where: { orderId },
      update: { partnerId, otp, status: 'ASSIGNED', assignedAt: new Date() },
      create: { orderId, partnerId, otp, assignedAt: new Date() },
    });

    await prisma.order.update({ where: { id: orderId }, data: { status: 'OUT_FOR_DELIVERY' } });
    await prisma.statusTimeline.create({ data: { orderId, status: 'OUT_FOR_DELIVERY', note: 'Delivery partner assigned' } });

    // Notify partner
    await prisma.notification.create({
      data: { userId: partnerId, title: 'New Delivery Assigned', message: `You have a new delivery order #${orderId.slice(0, 8)}`, type: 'DELIVERY_ASSIGNED' },
    });

    emitToRoom(`order:${orderId}`, 'order:status:update', {
      orderId, status: 'OUT_FOR_DELIVERY', timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Delivery assigned', data: task });
  } catch (err) { next(err); }
};

export const updateDeliveryStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.deliveryTask.findFirst({
      where: { id, partnerId: req.user!.userId },
    });
    if (!task) throw new AppError('Delivery task not found', 404);

    const updateData: Record<string, unknown> = { status };
    if (status === 'PICKED_UP') updateData.pickedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const updated = await prisma.deliveryTask.update({ where: { id }, data: updateData });

    if (status === 'DELIVERED') {
      await prisma.order.update({ where: { id: task.orderId }, data: { status: 'DELIVERED' } });
      await prisma.statusTimeline.create({ data: { orderId: task.orderId, status: 'DELIVERED', note: 'Delivered' } });
      await prisma.payment.updateMany({
        where: { orderId: task.orderId, method: 'COD' },
        data: { status: 'PAID' },
      });
    }

    emitToRoom(`order:${task.orderId}`, 'order:status:update', {
      orderId: task.orderId, status: status === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) { next(err); }
};

export const verifyOtp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const task = await prisma.deliveryTask.findFirst({
      where: { id, partnerId: req.user!.userId },
    });
    if (!task) throw new AppError('Delivery task not found', 404);
    if (task.otp !== otp) throw new AppError('Invalid OTP', 400);

    const updated = await prisma.deliveryTask.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });

    await prisma.order.update({ where: { id: task.orderId }, data: { status: 'DELIVERED' } });
    await prisma.statusTimeline.create({ data: { orderId: task.orderId, status: 'DELIVERED', note: 'OTP verified, delivered' } });
    await prisma.payment.updateMany({
      where: { orderId: task.orderId, method: 'COD' },
      data: { status: 'PAID' },
    });

    emitToRoom(`order:${task.orderId}`, 'order:status:update', {
      orderId: task.orderId, status: 'DELIVERED', timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'OTP verified, delivery confirmed', data: updated });
  } catch (err) { next(err); }
};
