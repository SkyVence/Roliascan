import "fastify"
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify"
import type { authenticate, adminOnly, adminOrModOnly, hasPermission } from "../middleware/auth"
import type { checkPermission } from "../services/permission"
import type { UserRole } from "../schemas/types" // Corrected import path

// Augment the FastifyInstance interface with custom decorators
declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authenticate
    adminOnly: typeof adminOnly
    adminOrModOnly: typeof adminOrModOnly
    hasPermission: typeof hasPermission
    checkPermission: typeof checkPermission
  }

  // Augment the FastifyRequest interface to include the user object added by @fastify/jwt
  interface FastifyRequest {
    user: {
      id: string
      role: UserRole
      // Add any other properties included in your JWT payload
      iat?: number
      exp?: number
    }
  }
} 