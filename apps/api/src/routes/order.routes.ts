import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { createOrder, getMyOrders, getOrderById, updateOrderStatus, getAllOrders } from '../controllers/order.controller';
import { UserRole } from '@mediswiftzzz/types';

const router = Router();
router.use(authenticate);
router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/all', authorize(UserRole.ADMIN, UserRole.PHARMACIST), getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', authorize(UserRole.ADMIN, UserRole.PHARMACIST), updateOrderStatus);

export default router;
