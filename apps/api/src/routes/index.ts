import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import prescriptionRoutes from './prescription.routes';
import medicineRoutes from './medicine.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import deliveryRoutes from './delivery.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/medicines', medicineRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
