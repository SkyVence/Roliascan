import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler, notFound, badRequest } from "../utils/handler"
import * as userService from "../services/user"

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
})

export default async function (fastify: FastifyInstance) {
  // Get user profile
  fastify.get(
    "/:id",
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }

      const user = await userService.findUserById(id)
      if (!user) {
        notFound(reply, "User not found")
        return
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
      }
    }),
  )

  // Update user profile
  fastify.patch(
    "/profile",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: updateProfileSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const updates = request.body as z.infer<typeof updateProfileSchema>
      const userId = request.user.id

      // Check if username is taken
      if (updates.username) {
        const usernameTaken = await userService.isUsernameTaken(updates.username, userId)
        if (usernameTaken) {
          badRequest(reply, "Username already taken")
          return
        }
      }

      // Check if email is taken
      if (updates.email) {
        const emailTaken = await userService.isEmailTaken(updates.email, userId)
        if (emailTaken) {
          badRequest(reply, "Email already taken")
          return
        }
      }

      // Update user
      const updatedUser = await userService.updateUser(userId, updates)
      if (!updatedUser) {
        notFound(reply, "User not found")
        return
      }

      return {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
        },
      }
    }),
  )

  // Get user permissions
  fastify.get(
    "/permissions",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request) => {
      const userId = request.user.id
      const permissions = await userService.getUserPermissions(userId)
      return { permissions }
    }),
  )
}
