import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getDashboardMetrics, getUsers, toggleUserStatus, getAuditLogs, getDeliveryPartners } from '../controllers/admin.controller';
import { UserRole } from '@mediswiftzzz/types';

const router = Router();
router.use(authenticate, authorize(UserRole.ADMIN, UserRole.PHARMACIST));
router.get('/dashboard', getDashboardMetrics);
router.get('/users', getUsers);
router.get('/delivery-partners', getDeliveryPartners);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
