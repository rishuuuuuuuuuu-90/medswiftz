import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import cloudinary from '../utils/cloudinary';
import { UserRole } from '@mediswiftzzz/types';

export const uploadPrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('File required', 400);

    const fileBuffer = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${fileBuffer}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'mediswiftzzz/prescriptions',
      resource_type: 'auto',
      access_mode: 'authenticated',
    });

    const prescription = await prisma.prescription.create({
      data: {
        userId: req.user!.userId,
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        publicId: result.public_id,
      },
    });

    res.status(201).json({ success: true, message: 'Prescription uploaded', data: prescription });
  } catch (err) { next(err); }
};

export const getMyPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, message: 'Prescriptions fetched', data: prescriptions });
  } catch (err) { next(err); }
};

export const getPrescriptionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!prescription) throw new AppError('Prescription not found', 404);

    const isOwner = prescription.userId === req.user!.userId;
    const isStaff = [UserRole.PHARMACIST, UserRole.ADMIN].includes(req.user!.role);
    if (!isOwner && !isStaff) throw new AppError('Forbidden', 403);

    res.json({ success: true, message: 'Prescription fetched', data: prescription });
  } catch (err) { next(err); }
};

export const getPendingPrescriptions = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, message: 'Pending prescriptions fetched', data: prescriptions });
  } catch (err) { next(err); }
};

export const reviewPrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Status must be APPROVED or REJECTED', 400);
    }

    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new AppError('Prescription not found', 404);
    if (prescription.status !== 'PENDING') throw new AppError('Prescription already reviewed', 400);

    if (status === 'REJECTED' && !reviewNote) {
      throw new AppError('Review note required for rejection', 400);
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status, reviewedById: req.user!.userId, reviewNote, reviewedAt: new Date() },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: `PRESCRIPTION_${status}`,
        entityType: 'Prescription',
        entityId: id,
        details: reviewNote,
      },
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: prescription.userId,
        title: `Prescription ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: status === 'APPROVED'
          ? 'Your prescription has been approved. You can now place your order.'
          : `Your prescription was rejected. Reason: ${reviewNote}`,
        type: 'PRESCRIPTION_REVIEW',
      },
    });

    res.json({ success: true, message: `Prescription ${status.toLowerCase()}`, data: updated });
  } catch (err) { next(err); }
};
