import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  getMyDeliveries, getDeliveryByOrder, assignDelivery, updateDeliveryStatus, verifyOtp,
} from '../controllers/delivery.controller';
import { UserRole } from '@mediswiftzzz/types';

const router = Router();
router.use(authenticate);
router.get('/my', authorize(UserRole.DELIVERY_PARTNER), getMyDeliveries);
router.get('/order/:orderId', getDeliveryByOrder);
router.post('/assign', authorize(UserRole.ADMIN, UserRole.PHARMACIST), assignDelivery);
router.put('/:id/status', authorize(UserRole.DELIVERY_PARTNER), updateDeliveryStatus);
router.post('/:id/verify-otp', authorize(UserRole.DELIVERY_PARTNER), verifyOtp);

export default router;
