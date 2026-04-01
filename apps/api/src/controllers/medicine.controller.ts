import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMedicines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, requiresPrescription, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { isActive: true };
    if (search) where.name = { contains: String(search), mode: 'insensitive' };
    if (category) where.category = String(category);
    if (requiresPrescription !== undefined) where.requiresPrescription = requiresPrescription === 'true';

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: { inventory: true },
        skip, take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.medicine.count({ where }),
    ]);

    res.json({ success: true, message: 'Medicines fetched', data: { medicines, total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
};

export const getMedicineById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: req.params.id },
      include: { inventory: true },
    });
    if (!medicine) throw new AppError('Medicine not found', 404);
    res.json({ success: true, message: 'Medicine fetched', data: medicine });
  } catch (err) { next(err); }
};

export const createMedicine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, genericName, manufacturer, category, description, requiresPrescription, price, imageUrl, initialStock } = req.body;
    const medicine = await prisma.medicine.create({
      data: {
        name, genericName, manufacturer, category, description,
        requiresPrescription: requiresPrescription || false, price, imageUrl,
        inventory: { create: { stock: initialStock || 0 } },
      },
      include: { inventory: true },
    });
    res.status(201).json({ success: true, message: 'Medicine created', data: medicine });
  } catch (err) { next(err); }
};

export const updateMedicine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { initialStock, ...data } = req.body;
    const medicine = await prisma.medicine.update({
      where: { id: req.params.id },
      data,
      include: { inventory: true },
    });
    res.json({ success: true, message: 'Medicine updated', data: medicine });
  } catch (err) { next(err); }
};

export const updateStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stock } = req.body;
    const inventory = await prisma.inventory.upsert({
      where: { medicineId: req.params.id },
      update: { stock },
      create: { medicineId: req.params.id, stock },
    });
    res.json({ success: true, message: 'Stock updated', data: inventory });
  } catch (err) { next(err); }
};
