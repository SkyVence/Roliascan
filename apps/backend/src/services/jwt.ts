import type { FastifyInstance } from "fastify"
import { config } from "../config"

interface TokenPayload {
  id: string
  role: string
}

/**
 * Generate a JWT token
 * @param fastify Fastify instance
 * @param payload Token payload
 * @returns JWT token
 */
export function generateToken(fastify: FastifyInstance, payload: TokenPayload): string {
  return fastify.jwt.sign(payload, {
    expiresIn: config.jwt.expiresIn,
  })
}

/**
 * Verify a JWT token
 * @param fastify Fastify instance
 * @param token JWT token
 * @returns Token payload or null if invalid
 */
export async function verifyToken(fastify: FastifyInstance, token: string): Promise<TokenPayload | null> {
  try {
    return await fastify.jwt.verify<TokenPayload>(token)
  } catch (error) {
    return null
  }
}
