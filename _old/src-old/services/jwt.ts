import jwt from 'jsonwebtoken';
import { config } from '@/config';
interface JwtPayload {
  userId: string; // Adjust type as needed (e.g., number or string)
  email: string;
}

/**
 * Generates a JWT token.
 * @param userId - The user's ID.
 * @param email - The user's email.
 * @returns The generated JWT token.
 */
export const generateJwtToken = (userId: string, email: string): string => {
  const payload: JwtPayload = { userId, email };

  // TODO: Consider adding expiration time (e.g., { expiresIn: '1h' })
  const token = jwt.sign(payload, config.JWT_SECRET);

  return token;
};
