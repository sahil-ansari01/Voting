// Import Prisma client from the generated client
import { PrismaClient } from '../../generated/prisma';

// Create and export a singleton instance of PrismaClient
// This ensures we have a single database connection throughout the application
export const prisma = new PrismaClient();


