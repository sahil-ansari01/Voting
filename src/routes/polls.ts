import { Router } from 'express';
import { createPoll, listPolls, getPoll } from '../controllers/polls';

// Create Express router for poll-related endpoints
const router = Router();

// POST /api/polls - Create a new poll with options
router.post('/', createPoll);

// GET /api/polls - Retrieve all polls with their options
router.get('/', listPolls);

// GET /api/polls/:id - Retrieve a specific poll by ID with vote counts
router.get('/:id', getPoll);

export default router;


