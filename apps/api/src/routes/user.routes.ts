import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile, addAddress, updateAddress, deleteAddress } from '../controllers/user.controller';

const router = Router();

router.use(authenticate);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
