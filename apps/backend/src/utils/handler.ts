import type { FastifyRequest, FastifyReply } from "fastify"
import { ZodError } from "zod"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string | string[] | Record<string, string[]>
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

/**
 * Standard API handler with error handling
 * @param handler Handler function
 * @returns Wrapped handler function
 */
export function apiHandler<T = any>(handler: (request: FastifyRequest, reply: FastifyReply) => Promise<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await handler(request, reply)

      // If the handler has already sent a response, return
      if (reply.sent) return

      // Format successful response
      const response: ApiResponse<T> = {
        success: true,
        data: result,
      }

      // If result has pagination, add it to response
      if (result && typeof result === "object" && "pagination" in result) {
        response.pagination = result.pagination
        response.data = result.data
      }

      return response
    } catch (error) {
      // Log error
      request.log.error(error)

      // Format error response
      const response: ApiResponse<null> = {
        success: false,
        error: "Internal Server Error",
      }

      // Handle specific error types
      if (error instanceof ZodError) {
        reply.code(400)
        response.error = error.format()
      } else if (error instanceof Error) {
        reply.code(400)
        response.error = error.message
      }

      return response
    }
  }
}

/**
 * Create a not found response
 * @param reply FastifyReply
 * @param message Error message
 */
export function notFound(reply: FastifyReply, message = "Resource not found") {
  reply.code(404).send({
    success: false,
    error: message,
  })
}

/**
 * Create a forbidden response
 * @param reply FastifyReply
 * @param message Error message
 */
export function forbidden(reply: FastifyReply, message = "Forbidden") {
  reply.code(403).send({
    success: false,
    error: message,
  })
}

/**
 * Create an unauthorized response
 * @param reply FastifyReply
 * @param message Error message
 */
export function unauthorized(reply: FastifyReply, message = "Unauthorized") {
  reply.code(401).send({
    success: false,
    error: message,
  })
}

/**
 * Create a bad request response
 * @param reply FastifyReply
 * @param message Error message
 */
export function badRequest(reply: FastifyReply, message = "Bad Request") {
  reply.code(400).send({
    success: false,
    error: message,
  })
}

/**
 * Create a success response
 * @param reply FastifyReply
 * @param data Response data
 * @param message Success message
 */
export function success<T>(reply: FastifyReply, data?: T, message?: string) {
  reply.code(200).send({
    success: true,
    data,
    message,
  })
}

/**
 * Create a created response
 * @param reply FastifyReply
 * @param data Response data
 * @param message Success message
 */
export function created<T>(reply: FastifyReply, data?: T, message = "Resource created successfully") {
  reply.code(201).send({
    success: true,
    data,
    message,
  })
}
