import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Submit a vote for a specific poll option
 * Prevents duplicate votes and broadcasts real-time updates to connected clients
 */
export async function createVote(req: Request, res: Response) {
  try {
    // Extract vote data from request body
    const { userId, pollOptionId } = req.body as { userId: number | string; pollOptionId: number | string };
    
    // Convert string IDs to numbers if needed
    const userIdNum = typeof userId === 'string' ? Number(userId) : userId;
    const optionIdNum = typeof pollOptionId === 'string' ? Number(pollOptionId) : pollOptionId;
    
    // Validate that both IDs are valid numbers
    if (!Number.isFinite(userIdNum) || !Number.isFinite(optionIdNum)) {
      return res.status(400).json({ message: 'Invalid userId or pollOptionId' });
    }

    // Verify that the poll option exists
    const option = await prisma.pollOption.findUnique({ 
      where: { id: optionIdNum }, 
      include: { poll: true } 
    });
    if (!option) return res.status(404).json({ message: 'Poll option not found' });

    // Enforce one vote per poll (not per option)
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: userIdNum,
        pollOption: { pollId: option.pollId }
      },
      select: { id: true }
    });
    if (existingVote) {
      return res.status(409).json({ message: 'You have already voted in this poll' });
    }

    // Create the vote record
    const vote = await prisma.vote.create({ 
      data: { userId: userIdNum, pollOptionId: optionIdNum } 
    });

    // Fetch updated poll data with vote counts for real-time broadcasting
    const pollWithCounts = await prisma.poll.findUnique({
      where: { id: option.pollId },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        }
      }
    });

    // Broadcast updated poll results to all clients in the poll room
    const io = req.app.locals.io as import('socket.io').Server;
    io.to(`poll:${option.pollId}`).emit('poll_results', {
      pollId: option.pollId,
      options: pollWithCounts?.options.map(o => ({ 
        id: o.id, 
        text: o.text, 
        votes: o._count.votes 
      }))
    });

    res.status(201).json(vote);
  } catch (err: any) {
    // Handle unique constraint violation (duplicate vote)
    if (err?.code === 'P2002') {
      return res.status(409).json({ message: 'User has already voted for this option' });
    }
    res.status(500).json({ message: 'Failed to submit vote' });
  }
}


