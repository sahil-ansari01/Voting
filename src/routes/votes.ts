import { Router } from 'express';
import { createVote } from '../controllers/votes';

// Create Express router for vote-related endpoints
const router = Router();

// POST /api/votes - Submit a vote for a poll option
router.post('/', createVote);

export default router;


