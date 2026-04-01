import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@mediswiftzzz/types';

const generateTokens = (userId: string, email: string, role: UserRole) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, phone, role } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      throw new AppError('Email or phone already registered', 400);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone, role: role || 'PATIENT' },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });

    // Create cart for patient
    if (user.role === 'PATIENT') {
      await prisma.cart.create({ data: { userId: user.id } });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as UserRole);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.status(201).json({ success: true, message: 'Registered successfully', data: { user, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as UserRole);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.json({
      success: true, message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
        accessToken, refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string; email: string; role: UserRole };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = generateTokens(user.id, user.email, user.role as UserRole);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    res.json({ success: true, message: 'Tokens refreshed', data: tokens });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { refreshToken: null },
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true,
        addresses: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, message: 'User fetched', data: user });
  } catch (err) {
    next(err);
  }
};
