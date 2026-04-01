import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  uploadPrescription,
  getMyPrescriptions,
  getPrescriptionById,
  getPendingPrescriptions,
  reviewPrescription,
} from '../controllers/prescription.controller';
import { UserRole } from '@mediswiftzzz/types';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'));
  },
});

router.use(authenticate);
router.post('/upload', upload.single('file'), uploadPrescription);
router.get('/my', getMyPrescriptions);
router.get('/pending', authorize(UserRole.PHARMACIST, UserRole.ADMIN), getPendingPrescriptions);
router.get('/:id', getPrescriptionById);
router.post('/:id/review', authorize(UserRole.PHARMACIST, UserRole.ADMIN), reviewPrescription);

export default router;
