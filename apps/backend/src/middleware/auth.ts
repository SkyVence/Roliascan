import type { FastifyRequest, FastifyReply } from "fastify"
import { config } from "../config"
import { unauthorized, forbidden } from "../utils/handler"
import type { UserRole } from "../schemas/types"

// Define the expected user payload structure, matching fastify.d.ts
interface JwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * @param request FastifyRequest
 * @param reply FastifyReply
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  request.log.info(`Authenticating request: ${request.id}`)
  try {
    const user = await request.jwtVerify<JwtPayload>()
    request.log.info(`Authentication successful for user ${user.id} on request ${request.id}`)
    // Note: request.user is populated automatically by jwtVerify
  } catch (err: any) { // Catch specific error type if known, else any
    request.log.error({ reqId: request.id, error: err }, `Authentication failed: ${err.message || 'Unknown JWT error'}`)
    unauthorized(reply, "Authentication required")
  }
}

/**
 * Admin-only middleware
 * @param request FastifyRequest
 * @param reply FastifyReply
 */
export async function adminOnly(request: FastifyRequest, reply: FastifyReply) {
  request.log.info(`Checking admin access for request: ${request.id}`)
  try {
    const user = await request.jwtVerify<JwtPayload>()
    request.log.info(`Verified user ${user.id} with role ${user.role} for request ${request.id}`)
    if (user.role !== config.roles.admin) {
      request.log.warn(`Admin access denied for user ${user.id} (role: ${user.role}) on request ${request.id}`)
      forbidden(reply, "Admin access required")
      return // Important: return after sending reply
    }
    request.log.info(`Admin access granted for user ${user.id} on request ${request.id}`)
  } catch (err: any) {
    request.log.error({ reqId: request.id, error: err }, `Admin check failed during JWT verification: ${err.message || 'Unknown JWT error'}`)
    unauthorized(reply, "Authentication required")
  }
}

/**
 * Admin or moderator middleware
 * @param request FastifyRequest
 * @param reply FastifyReply
 */
export async function adminOrModOnly(request: FastifyRequest, reply: FastifyReply) {
  request.log.info(`Checking admin/mod access for request: ${request.id}`)
  try {
    const user = await request.jwtVerify<JwtPayload>()
    request.log.info(`Verified user ${user.id} with role ${user.role} for request ${request.id}`)
    const allowedRoles = [config.roles.admin, config.roles.moderator]
    if (!allowedRoles.includes(user.role)) {
      request.log.warn(`Admin/Mod access denied for user ${user.id} (role: ${user.role}) on request ${request.id}`)
      forbidden(reply, "Admin or moderator access required")
      return // Important: return after sending reply
    }
    request.log.info(`Admin/Mod access granted for user ${user.id} on request ${request.id}`)
  } catch (err: any) {
    request.log.error({ reqId: request.id, error: err }, `Admin/Mod check failed during JWT verification: ${err.message || 'Unknown JWT error'}`)
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
    request.log.info(`Checking permission '${permissionName}' for request: ${request.id}`)
    try {
      const user = await request.jwtVerify<JwtPayload>()
      request.log.info(`Verified user ${user.id} with role ${user.role} for permission check '${permissionName}' on request ${request.id}`)

      // Admin has all permissions
      if (user.role === config.roles.admin) {
        request.log.info(`Admin user ${user.id} granted permission '${permissionName}' via role on request ${request.id}`)
        return
      }

      // Check role-based permissions safely
      const userRole = user.role;
      if (userRole in config.rolePermissions) {
        const rolePermissions = config.rolePermissions[userRole as keyof typeof config.rolePermissions];
        // Ensure the array is not of type never[] by checking length or content before calling .includes
        // Suppress stubborn type error for now to focus on runtime debugging
        // @ts-ignore
        if (rolePermissions.length > 0 && rolePermissions.includes(permissionName)) {
          request.log.info(`User ${user.id} granted permission '${permissionName}' via role '${user.role}' on request ${request.id}`)
          return
        }
      }

      // Check user-specific permissions
      request.log.info(`Checking specific permission '${permissionName}' for user ${user.id} on request ${request.id}`)
      const hasSpecificPermission = await request.server.checkPermission(user.id, user.role, permissionName)

      if (!hasSpecificPermission) {
        request.log.warn(`Permission '${permissionName}' denied for user ${user.id} on request ${request.id}`)
        forbidden(reply, `Permission '${permissionName}' required`)
        return // Important: return after sending reply
      }
      request.log.info(`User ${user.id} granted specific permission '${permissionName}' on request ${request.id}`)

    } catch (err: any) {
      request.log.error({ reqId: request.id, error: err, permission: permissionName }, `Permission check failed during JWT verification: ${err.message || 'Unknown JWT error'}`)
      unauthorized(reply, "Authentication required")
    }
  }
}
