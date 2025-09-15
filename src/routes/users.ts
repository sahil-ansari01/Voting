import { Router } from 'express';
import { createUser, listUsers } from '../controllers/users';

// Create Express router for user-related endpoints
const router = Router();

// POST /api/users - Create a new user account
router.post('/', createUser);

// GET /api/users - Retrieve list of all users
router.get('/', listUsers);

export default router;


