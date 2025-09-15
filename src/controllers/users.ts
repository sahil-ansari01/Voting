import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
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


