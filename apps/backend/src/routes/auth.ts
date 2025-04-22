import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler, badRequest, unauthorized } from "../utils/handler"
import * as userService from "../services/user"
import { verifyPassword } from "../services/password"
import { generateToken } from "../services/jwt"
import { config } from "../config"

// Helper function to convert expiration string (e.g., "7d", "1h") to seconds
function expiresInToSeconds(expiresIn: string): number | undefined {
  const unit = expiresIn.charAt(expiresIn.length - 1)
  const value = parseInt(expiresIn.slice(0, -1), 10)
  if (isNaN(value)) return undefined

  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 60 * 60 * 24
    default: return undefined
  }
}

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export default async function (fastify: FastifyInstance) {
  // Register a new user
  fastify.post(
    "/register",
    {
      schema: {
        body: registerSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { email, username, password } = request.body as z.infer<typeof registerSchema>

      // Check if user already exists
      const existingUser = await userService.findUserByEmail(email)
      if (existingUser) {
        badRequest(reply, "User with this email already exists")
        return
      }

      // Check if username is taken
      const usernameTaken = await userService.isUsernameTaken(username)
      if (usernameTaken) {
        badRequest(reply, "Username already taken")
        return
      }

      // Create user
      const user = await userService.createUser({ email, username, password })

      // Generate token
      const token = generateToken(fastify, { id: user.id, role: user.role })

      // Set token in cookie
      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        secure: config.server.isProd,
        signed: true,
        maxAge: expiresInToSeconds(config.jwt.expiresIn),
        sameSite: "lax",
      })

      // Return only user data
      return { user: { id: user.id, email: user.email, username: user.username, role: user.role } }
    }),
  )

  // Login
  fastify.post(
    "/login",
    {
      schema: {
        body: loginSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { email, password } = request.body as z.infer<typeof loginSchema>

      // Find user
      const user = await userService.findUserByEmail(email)
      if (!user) {
        unauthorized(reply, "Invalid credentials")
        return
      }

      // Check if user is banned
      if (user.isBanned) {
        unauthorized(reply, "Your account has been banned")
        return
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password)
      if (!isPasswordValid) {
        unauthorized(reply, "Invalid credentials")
        return
      }

      // Generate token
      const token = generateToken(fastify, { id: user.id, role: user.role })

      // Set token in cookie
      reply.setCookie("token", token, {
        path: "/",
        httpOnly: true,
        secure: config.server.isProd,
        signed: true,
        maxAge: expiresInToSeconds(config.jwt.expiresIn),
        sameSite: "lax",
      })

      // Return only user data (excluding password)
      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isMuted: user.isMuted,
        },
      }
    }),
  )

  // Get current user
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      const userId = request.user.id

      const user = await userService.findUserById(userId)
      if (!user) {
        unauthorized(reply, "User not found")
        return
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isMuted: user.isMuted,
          isBanned: user.isBanned,
        },
      }
    }),
  )
}
