import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);
router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
