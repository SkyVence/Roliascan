import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken'; 
import { config } from '@/config';

type DrizzleDB = any; 

// Define the structure of your auth context
// This is just an example, adjust it based on your needs
export type AuthContext = {
  userId: string | null;
  email: string | null;
  // Add Role, permissions when setup
};

interface JwtPayload {
  userId: string;
  email: string;
}

export function makeAuthContext(db: DrizzleDB, req: FastifyRequest): AuthContext {
  console.log('Attempting to create auth context for request:', req.id);

  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in Authorization header for request:', req.id);
      return { userId: null, email: null };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('Bearer token format invalid for request:', req.id);
        return { userId: null, email: null };
    }

    // Verify the token
    // Note: You might want to handle token expiration specifically (e.g., TokenExpiredError)
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    // Check if the payload contains the userId
    if (!decoded || typeof decoded.userId !== 'string') {
      console.error('JWT payload invalid or missing userId for request:', req.id);
      return { userId: null, email: null };
    }

    console.log(`Successfully authenticated user ${decoded.userId} for request:`, req.id);
    // Optionally, you could fetch more user details from the db here if needed
    // const user = await db.select(...).from(...).where(eq(users.id, decoded.userId));

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
        // Specific JWT errors like verification failure, expiration etc.
        console.error('JWT verification failed for request:', req.id, error.message);
    } else {
        // Other unexpected errors
        console.error('Unexpected error creating auth context for request:', req.id, error);
    }
    // Return null userId on any authentication error
    return { userId: null, email: null };
  }
}
