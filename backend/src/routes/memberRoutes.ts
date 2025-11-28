import express from 'express';
import { createMember, getParentMembers, getClubMembers, getMember, updateMember, deleteMember } from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo(['PARENT']), createMember);
router.get('/my-children', restrictTo(['PARENT']), getParentMembers);
router.get('/club-members', restrictTo(['OWNER', 'COACH']), getClubMembers);
router.get('/:id', getMember);
router.put('/:id', restrictTo(['PARENT']), updateMember);
router.delete('/:id', restrictTo(['PARENT']), deleteMember);

export default router;
