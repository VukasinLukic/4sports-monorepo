import express from 'express';
import { createMember, getParentMembers, getClubMembers, getAllMembers, getMember, updateMember, deleteMember } from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes (no auth required)
router.get('/', getAllMembers);
router.get('/club-members', getClubMembers);
router.get('/:id', getMember);

// Protected routes (require authentication)
router.use(protect);

router.post('/', restrictTo(['PARENT']), createMember);
router.get('/my-children', restrictTo(['PARENT']), getParentMembers);
router.put('/:id', restrictTo(['PARENT']), updateMember);
router.delete('/:id', restrictTo(['PARENT']), deleteMember);

export default router;
