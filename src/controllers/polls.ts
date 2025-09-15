import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Create a new poll with multiple options
 * Validates that at least two options are provided
 */
export async function createPoll(req: Request, res: Response) {
  try {
    // Extract poll data from request body
    const { creatorId, question, options, isPublished } = req.body as {
      creatorId: number | string;
      question: string;
      options: string[];
      isPublished?: boolean;
    };
    
    // Convert creatorId to number if it's a string
    const creatorIdNum = typeof creatorId === 'string' ? Number(creatorId) : creatorId;
    if (!Number.isFinite(creatorIdNum)) {
      return res.status(400).json({ message: 'Invalid creatorId' });
    }
    
    // Validate that at least two options are provided
    if (!options || options.length < 2) {
      return res.status(400).json({ message: 'At least two options are required' });
    }

    // Create poll with associated options in a single transaction
    const poll = await prisma.poll.create({
      data: {
        creatorId: creatorIdNum,
        question,
        isPublished: Boolean(isPublished),
        options: { create: options.map(text => ({ text })) }
      },
      include: { options: true }
    });
    res.status(201).json(poll);
  } catch (_err) {
    res.status(500).json({ message: 'Failed to create poll' });
  }
}

/**
 * Retrieve all polls with their options and creator information
 * Returns polls with vote counts for each option
 */
export async function listPolls(_req: Request, res: Response) {
  try {
    // Fetch all polls with their options and creator details
    const polls = await prisma.poll.findMany({ 
      include: { 
        options: true, 
        creator: { select: { id: true, name: true } } 
      } 
    });
    res.json(polls);
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
}

/**
 * Retrieve a specific poll by ID with vote counts
 * Returns poll details including vote counts for each option
 */
export async function getPoll(req: Request, res: Response) {
  try {
    // Parse and validate poll ID from URL parameters
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid poll id' });
    
    // Fetch poll with options and vote counts
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        creator: { select: { id: true, name: true } }
      }
    });
    
    // Return 404 if poll doesn't exist
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    res.json(poll);
  } catch (_err) {
    res.status(500).json({ message: 'Failed to fetch poll' });
  }
}


