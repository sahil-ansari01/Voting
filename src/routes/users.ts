import { Router } from 'express';
import { createUser, listUsers, loginUser } from '../controllers/users';

// Create Express router for user-related endpoints
const router = Router();

// POST /api/users - Create a new user account
router.post('/', createUser);

// POST /api/users/login - Authenticate user and issue JWT
router.post('/login', loginUser);

// GET /api/users - Retrieve list of all users
router.get('/', listUsers);

export default router;


