import express from 'express';
import { createMember, getParentMembers, getClubMembers, getAllMembers, getMember, getMemberByUserId, updateMember, deleteMember, getMyMemberProfile, updateMyMemberProfile } from '../controllers/memberController';
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

// Get member by user ID (for profile lookups from comments)
router.get('/by-user/:userId', getMemberByUserId);

// Member CRUD
router.post('/', restrictTo(['PARENT']), createMember);
router.get('/:id', getMember);
router.put('/:id', restrictTo(['PARENT', 'OWNER', 'COACH']), updateMember);
router.delete('/:id', restrictTo(['PARENT', 'OWNER', 'COACH']), deleteMember);

export default router;
