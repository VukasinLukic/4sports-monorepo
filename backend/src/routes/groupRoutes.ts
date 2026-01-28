import express from 'express';
import {
  createGroup,
  getClubGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  addMemberToGroup,
  removeMemberFromGroup
} from '../controllers/groupController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo(['OWNER', 'COACH']), createGroup);
router.get('/', getClubGroups);
router.get('/:id', getGroup);
router.put('/:id', restrictTo(['OWNER', 'COACH']), updateGroup);
router.delete('/:id', restrictTo(['OWNER']), deleteGroup);

// Group members routes
router.get('/:id/members', getGroupMembers);
router.post('/:id/members', restrictTo(['OWNER', 'COACH']), addMemberToGroup);
router.delete('/:id/members/:memberId', restrictTo(['OWNER', 'COACH']), removeMemberFromGroup);

export default router;
