import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
};

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: { items: { include: { medicine: { include: { inventory: true } } } } },
    });
    if (!cart) {
      return res.json({ success: true, message: 'Cart fetched', data: { items: [], totalAmount: 0 } });
    }
    const totalAmount = cart.items.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);
    res.json({ success: true, message: 'Cart fetched', data: { ...cart, totalAmount } });
  } catch (err) { next(err); }
};

export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { medicineId, quantity = 1 } = req.body;
    const medicine = await prisma.medicine.findUnique({
      where: { id: medicineId },
      include: { inventory: true },
    });
    if (!medicine || !medicine.isActive) throw new AppError('Medicine not found', 404);
    if (!medicine.inventory || medicine.inventory.stock < quantity) throw new AppError('Insufficient stock', 400);

    const cart = await getOrCreateCart(req.user!.userId);
    const item = await prisma.cartItem.upsert({
      where: { cartId_medicineId: { cartId: cart.id, medicineId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, medicineId, quantity },
      include: { medicine: true },
    });
    res.status(201).json({ success: true, message: 'Item added to cart', data: item });
  } catch (err) { next(err); }
};

export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);

    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new AppError('Cart item not found', 404);

    const updated = await prisma.cartItem.update({ where: { id: itemId }, data: { quantity }, include: { medicine: true } });
    res.json({ success: true, message: 'Cart item updated', data: updated });
  } catch (err) { next(err); }
};

export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) throw new AppError('Cart not found', 404);
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new AppError('Cart item not found', 404);
    await prisma.cartItem.delete({ where: { id: itemId } });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) { next(err); }
};

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) return res.json({ success: true, message: 'Cart already empty' });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};
