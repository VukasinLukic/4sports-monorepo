import express from 'express';
import { getCoaches, getCoach } from '../controllers/coachController';

const router = express.Router();

// Public routes for coaches (no auth required for now)
router.get('/', getCoaches);
router.get('/:id', getCoach);

export default router;
