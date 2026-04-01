import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getMedicines, getMedicineById, createMedicine, updateMedicine, updateStock,
} from '../controllers/medicine.controller';
import { UserRole } from '@mediswiftzzz/types';

const router = Router();

router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.post('/', authenticate, authorize(UserRole.ADMIN, UserRole.PHARMACIST), createMedicine);
router.put('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.PHARMACIST), updateMedicine);
router.put('/:id/stock', authenticate, authorize(UserRole.ADMIN, UserRole.PHARMACIST), updateStock);

export default router;
