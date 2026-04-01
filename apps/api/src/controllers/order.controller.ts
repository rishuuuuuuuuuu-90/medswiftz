import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitToRoom } from '../socket';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { prescriptionId, addressId, paymentMethod = 'COD' } = req.body;
    const userId = req.user!.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { medicine: { include: { inventory: true } } } } },
    });
    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty', 400);

    // Validate Rx medicines
    const rxItems = cart.items.filter(i => i.medicine.requiresPrescription);
    if (rxItems.length > 0) {
      if (!prescriptionId) throw new AppError('Prescription required for Rx medicines', 400);
      const rx = await prisma.prescription.findFirst({
        where: { id: prescriptionId, userId, status: 'APPROVED' },
      });
      if (!rx) throw new AppError('Valid approved prescription required', 400);
    }

    // Validate stock
    for (const item of cart.items) {
      if (!item.medicine.inventory || item.medicine.inventory.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.medicine.name}`, 400);
      }
    }

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new AppError('Address not found', 404);

    const subtotal = cart.items.reduce((s, i) => s + i.medicine.price * i.quantity, 0);
    const deliveryFee = subtotal >= 500 ? 0 : 40;
    const totalAmount = subtotal + deliveryFee;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId, prescriptionId, addressId,
          totalAmount, deliveryFee,
          paymentMethod,
          items: {
            create: cart.items.map(i => ({
              medicineId: i.medicineId,
              quantity: i.quantity,
              price: i.medicine.price,
            })),
          },
        },
        include: { items: { include: { medicine: true } }, address: true },
      });

      // Deduct stock
      for (const item of cart.items) {
        await tx.inventory.update({
          where: { medicineId: item.medicineId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      // Payment record
      await tx.payment.create({
        data: { orderId: created.id, method: paymentMethod, amount: totalAmount,
          status: paymentMethod === 'COD' ? 'COD' : 'PENDING' },
      });

      // Timeline
      await tx.statusTimeline.create({
        data: { orderId: created.id, status: 'PRESCRIPTION_UPLOADED', note: 'Order placed' },
      });

      return created;
    });

    res.status(201).json({ success: true, message: 'Order created', data: order });
  } catch (err) { next(err); }
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: {
        items: { include: { medicine: true } },
        address: true, payment: true, delivery: true, timeline: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, message: 'Orders fetched', data: orders });
  } catch (err) { next(err); }
};

export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { medicine: true } },
        address: true, payment: true, delivery: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        prescription: true,
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== req.user!.userId &&
        !['ADMIN', 'PHARMACIST', 'DELIVERY_PARTNER'].includes(req.user!.role)) {
      throw new AppError('Forbidden', 403);
    }
    res.json({ success: true, message: 'Order fetched', data: order });
  } catch (err) { next(err); }
};

export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: Number(limit),
        include: { user: { select: { id: true, name: true, email: true, phone: true } }, address: true, payment: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ success: true, message: 'Orders fetched', data: { orders, total } });
  } catch (err) { next(err); }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404);

    const updated = await prisma.order.update({ where: { id }, data: { status } });

    await prisma.statusTimeline.create({ data: { orderId: id, status, note } });

    // Notify patient
    await prisma.notification.create({
      data: { userId: order.userId, title: 'Order Status Update', message: `Your order is now: ${status}`, type: 'ORDER_STATUS' },
    });

    emitToRoom(`order:${id}`, 'order:status:update', {
      orderId: id, status, timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Order status updated', data: updated });
  } catch (err) { next(err); }
};
