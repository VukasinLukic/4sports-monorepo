import express from 'express';
import {
  getMembershipEvidence,
  getMedicalEvidence,
  markMembershipPaid,
  updateMedicalInfo,
  createBulkMembershipPayments,
} from '../controllers/evidenceController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);
router.use(restrictTo(['OWNER', 'COACH']));

// Membership evidence
router.get('/membership', getMembershipEvidence);
router.post('/membership/create-bulk', createBulkMembershipPayments);
router.post('/membership/:memberId', markMembershipPaid);

// Medical evidence
router.get('/medical', getMedicalEvidence);
router.post('/medical/:memberId', updateMedicalInfo);

export default router;
