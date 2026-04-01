import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createRazorpayOrder, verifyPayment, getPaymentByOrder } from '../controllers/payment.controller';

const router = Router();
router.use(authenticate);
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.get('/order/:orderId', getPaymentByOrder);

export default router;
