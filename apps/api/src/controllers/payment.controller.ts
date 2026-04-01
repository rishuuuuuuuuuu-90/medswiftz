import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

let Razorpay: typeof import('razorpay');
try {
  Razorpay = require('razorpay');
} catch {
  // Razorpay not available in dev without keys
}

export const createRazorpayOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId },
    });
    if (!order) throw new AppError('Order not found', 404);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError('Payment gateway not configured', 500);
    }

    const razorpay = new (Razorpay as any)({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: orderId,
    });

    await prisma.payment.update({
      where: { orderId },
      data: { razorpayOrderId: rzpOrder.id },
    });

    res.json({ success: true, message: 'Razorpay order created', data: { razorpayOrderId: rzpOrder.id, amount: order.totalAmount } });
  } catch (err) { next(err); }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      throw new AppError('Payment verification failed', 400);
    }

    await prisma.payment.update({
      where: { orderId },
      data: { status: 'PAID', razorpayOrderId, razorpayPaymentId, razorpaySignature },
    });

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) { next(err); }
};

export const getPaymentByOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payment = await prisma.payment.findFirst({ where: { orderId: req.params.orderId } });
    if (!payment) throw new AppError('Payment not found', 404);
    res.json({ success: true, message: 'Payment fetched', data: payment });
  } catch (err) { next(err); }
};
