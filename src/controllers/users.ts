import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

/**
 * Create a new user account
 * Validates email uniqueness and hashes password before storing
 */
export async function createUser(req: Request, res: Response) {
  try {
    // Extract user data from request body
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    
    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
    
    // Hash password with salt rounds of 10
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new user in database
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    
    // Return user data without password hash
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (_err) {
    res.status(500).json({ message: 'Failed to create user' });
  }
}

/**
 * Retrieve a list of all users
 * Returns user data without sensitive information like password hashes
 */
export async function listUsers(_req: Request, res: Response) {
  try {
    // Fetch all users with selected fields (excluding password hash)
    const users = await prisma.user.findMany({ 
      select: { id: true, name: true, email: true, createdAt: true } 
    });
    res.json(users);
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

/**
 * Login user by email and password, returns JWT token
 */
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string }
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const secret = process.env.JWT_SECRET || 'dev_secret_change_me'
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' })

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (_err) {
    res.status(500).json({ message: 'Failed to login' })
  }
}


