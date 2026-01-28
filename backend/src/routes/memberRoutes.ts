import express from 'express';
import { createMember, getParentMembers, getClubMembers, getAllMembers, getMember, updateMember, deleteMember } from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Get all members for the coach's club (with computed statuses)
router.get('/', restrictTo(['OWNER', 'COACH']), getAllMembers);
router.get('/club-members', restrictTo(['OWNER', 'COACH']), getClubMembers);
router.get('/:id', getMember);

router.post('/', restrictTo(['PARENT']), createMember);
router.get('/my-children', restrictTo(['PARENT']), getParentMembers);
router.put('/:id', restrictTo(['PARENT']), updateMember);
router.delete('/:id', restrictTo(['PARENT']), deleteMember);

export default router;
