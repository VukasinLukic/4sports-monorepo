import express from 'express';
import { createMember, getParentMembers, getClubMembers, getAllMembers, getMember, updateMember, deleteMember, getMyMemberProfile, updateMyMemberProfile } from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Get all members for the coach's club (with computed statuses)
router.get('/', restrictTo(['OWNER', 'COACH']), getAllMembers);
router.get('/club-members', restrictTo(['OWNER', 'COACH']), getClubMembers);

// Parent routes (must come before /:id to avoid matching as ID)
router.get('/my-children', restrictTo(['PARENT']), getParentMembers);

// Member self-profile routes (for MEMBER role users)
router.get('/me', restrictTo(['MEMBER']), getMyMemberProfile);
router.put('/me', restrictTo(['MEMBER']), updateMyMemberProfile);

// Member CRUD
router.post('/', restrictTo(['PARENT']), createMember);
router.get('/:id', getMember);
router.put('/:id', restrictTo(['PARENT']), updateMember);
router.delete('/:id', restrictTo(['PARENT']), deleteMember);

export default router;
