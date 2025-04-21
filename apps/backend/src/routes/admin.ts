import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler, notFound, badRequest } from "../utils/handler"
import * as userService from "../services/user"
import * as permissionService from "../services/permission"

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "moderator", "uploader", "user"]),
})

const banUserSchema = z.object({
  isBanned: z.boolean(),
})

const muteUserSchema = z.object({
  isMuted: z.boolean(),
})

const assignPermissionSchema = z.object({
  permissionId: z.string().uuid(),
})

const createPermissionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export default async function (fastify: FastifyInstance) {
  // Update user role (admin only)
  fastify.patch(
    "/users/:id/role",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        body: updateUserRoleSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const { role } = request.body as z.infer<typeof updateUserRoleSchema>

      // Check if user exists
      const user = await userService.findUserById(id)
      if (!user) {
        notFound(reply, "User not found")
        return
      }

      // Update user role
      await userService.updateUser(id, { role })

      return { message: `User role updated to ${role}` }
    }),
  )

  // Ban/unban user (admin only)
  fastify.patch(
    "/users/:id/ban",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        body: banUserSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const { isBanned } = request.body as z.infer<typeof banUserSchema>

      // Check if user exists
      const user = await userService.findUserById(id)
      if (!user) {
        notFound(reply, "User not found")
        return
      }

      // Cannot ban admins
      if (user.role === "admin" && isBanned) {
        badRequest(reply, "Cannot ban admin users")
        return
      }

      // Update user ban status
      await userService.updateUser(id, { isBanned })

      return { message: isBanned ? "User banned successfully" : "User unbanned successfully" }
    }),
  )

  // Mute/unmute user (admin or moderator)
  fastify.patch(
    "/users/:id/mute",
    {
      onRequest: [fastify.adminOrModOnly],
      schema: {
        body: muteUserSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const { isMuted } = request.body as z.infer<typeof muteUserSchema>

      // Check if user exists
      const user = await userService.findUserById(id)
      if (!user) {
        notFound(reply, "User not found")
        return
      }

      // Cannot mute admins
      if (user.role === "admin" && isMuted) {
        badRequest(reply, "Cannot mute admin users")
        return
      }

      // Moderators cannot mute other moderators or admins
      if (request.user.role === "moderator" && ["admin", "moderator"].includes(user.role)) {
        badRequest(reply, "Moderators cannot mute other moderators or admins")
        return
      }

      // Update user mute status
      await userService.updateUser(id, { isMuted })

      return { message: isMuted ? "User muted successfully" : "User unmuted successfully" }
    }),
  )

  // Create permission (admin only)
  fastify.post(
    "/permissions",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        body: createPermissionSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { name, description } = request.body as z.infer<typeof createPermissionSchema>

      try {
        const permission = await permissionService.createPermission(name, description)
        return permission
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: error.message,
          })
        }
        throw error
      }
    }),
  )

  // Assign permission to user (admin only)
  fastify.post(
    "/users/:id/permissions",
    {
      onRequest: [fastify.adminOnly],
      schema: {
        body: assignPermissionSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const { permissionId } = request.body as z.infer<typeof assignPermissionSchema>

      // Check if user exists
      const user = await userService.findUserById(id)
      if (!user) {
        notFound(reply, "User not found")
        return
      }

      try {
        // Assign permission to user
        await permissionService.assignPermission(id, permissionId)
        return { message: "Permission assigned successfully" }
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: error.message,
          })
        }
        throw error
      }
    }),
  )

  // Remove permission from user (admin only)
  fastify.delete(
    "/users/:userId/permissions/:permissionId",
    {
      onRequest: [fastify.adminOnly],
    },
    apiHandler(async (request, reply) => {
      const { userId, permissionId } = request.params as { userId: string; permissionId: string }

      try {
        const success = await permissionService.removePermission(userId, permissionId)
        if (!success) {
          notFound(reply, "User does not have this permission")
          return
        }
        return { message: "Permission removed successfully" }
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({
            success: false,
            error: error.message,
          })
        }
        throw error
      }
    }),
  )

  // Get all users (admin only)
  fastify.get(
    "/users",
    {
      onRequest: [fastify.adminOnly],
    },
    apiHandler(async (request, reply) => {
      const { page, limit } = request.query as any

      // This would need to be implemented in the user service
      // For now, return an empty array
      return {
        data: [],
        pagination: {
          total: 0,
          page: page ? Number.parseInt(page) : 1,
          limit: limit ? Number.parseInt(limit) : 20,
          pages: 0,
        },
      }
    }),
  )
}
