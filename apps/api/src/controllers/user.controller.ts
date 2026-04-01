import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, addresses: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, message: 'Profile fetched', data: user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name && { name }), ...(phone && { phone }) },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) { next(err); }
};

export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { label, line1, line2, city, state, pincode, lat, lng, isDefault } = req.body;
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }
    const address = await prisma.address.create({
      data: { userId: req.user!.userId, label, line1, line2, city, state, pincode, lat, lng, isDefault: isDefault || false },
    });
    res.status(201).json({ success: true, message: 'Address added', data: address });
  } catch (err) { next(err); }
};

export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) throw new AppError('Address not found', 404);
    if (req.body.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    }
    const address = await prisma.address.update({ where: { id }, data: req.body });
    res.json({ success: true, message: 'Address updated', data: address });
  } catch (err) { next(err); }
};

export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) throw new AppError('Address not found', 404);
    await prisma.address.delete({ where: { id } });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
};
