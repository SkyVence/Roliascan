import type { FastifyRequest, FastifyReply } from "fastify"
import { config } from "../config"
import { unauthorized, forbidden } from "../utils/handler"

/**
 * Authentication middleware
 * @param request FastifyRequest
 * @param reply FastifyReply
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    unauthorized(reply, "Authentication required")
  }
}

/**
 * Admin-only middleware
 * @param request FastifyRequest
 * @param reply FastifyReply
 */
export async function adminOnly(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if (request.user.role !== config.roles.admin) {
      forbidden(reply, "Admin access required")
    }
  } catch (err) {
    unauthorized(reply, "Authentication required")
  }
}

/**
 * Admin or moderator middleware
 * @param request FastifyRequest
 * @param reply FastifyReply
 */
export async function adminOrModOnly(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    if (![config.roles.admin, config.roles.moderator].includes(request.user.role)) {
      forbidden(reply, "Admin or moderator access required")
    }
  } catch (err) {
    unauthorized(reply, "Authentication required")
  }
}

/**
 * Check if user has permission
 * @param permissionName Permission name to check
 * @returns Middleware function
 */
export function hasPermission(permissionName: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()

      // Admin has all permissions
      if (request.user.role === config.roles.admin) {
        return
      }

      // Check role-based permissions
      if (request.user.role && config.rolePermissions[request.user.role]?.includes(permissionName)) {
        return
      }

      // Check user-specific permissions
      const hasPermission = await request.server.checkPermission(request.user.id, request.user.role, permissionName)

      if (!hasPermission) {
        forbidden(reply, `Permission '${permissionName}' required`)
      }
    } catch (err) {
      unauthorized(reply, "Authentication required")
    }
  }
}
