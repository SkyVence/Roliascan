import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler, notFound, forbidden } from "../utils/handler"
import * as contentService from "../services/content"
import { checkPermission } from "../services/permission"

const createContentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  author: z.string().min(1),
  coverImage: z.string().optional(),
})

const updateContentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  author: z.string().min(1).optional(),
  coverImage: z.string().optional(),
})

export default async function (fastify: FastifyInstance) {
  // Get all contents with pagination
  fastify.get(
    "/",
    apiHandler(async (request) => {
      const { page, limit, sort } = request.query as any
      return contentService.getContents({
        page: page ? Number.parseInt(page) : undefined,
        limit: limit ? Number.parseInt(limit) : undefined,
        sort: sort as "newest" | "name",
      })
    }),
  )

  // Get content by ID or slug
  fastify.get(
    "/:idOrSlug",
    apiHandler(async (request, reply) => {
      const { idOrSlug } = request.params as { idOrSlug: string }
      const content = await contentService.getContent(idOrSlug)

      if (!content) {
        notFound(reply, "Content not found")
        return
      }

      return content
    }),
  )

  // Create new content
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createContentSchema,
      },
    },
    apiHandler(async (request, reply) => {
      // Check if user has permission to create content
      const hasPermission = await checkPermission(request.user.id, request.user.role, "create:content")
      if (!hasPermission) {
        forbidden(reply, "You don't have permission to create content")
        return
      }

      const { name, description, author, coverImage } = request.body as z.infer<typeof createContentSchema>

      const content = await contentService.createContent({
        name,
        description,
        author,
        coverImage,
        createdById: request.user.id,
      })

      return { content }
    }),
  )

  // Update content
  fastify.patch(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: updateContentSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const updates = request.body as z.infer<typeof updateContentSchema>

      // Get content
      const content = await contentService.getContent(id)
      if (!content) {
        notFound(reply, "Content not found")
        return
      }

      // Check if user is the creator or has admin/moderator role
      const isCreator = content.createdById === request.user.id
      const isAdminOrMod = ["admin", "moderator"].includes(request.user.role)

      if (!isCreator && !isAdminOrMod) {
        forbidden(reply, "You don't have permission to update this content")
        return
      }

      // Update content
      const updatedContent = await contentService.updateContent(id, updates)

      return { content: updatedContent }
    }),
  )

  // Delete content
  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }

      // Get content
      const content = await contentService.getContent(id)
      if (!content) {
        notFound(reply, "Content not found")
        return
      }

      // Check if user is the creator or has admin role
      const isCreator = content.createdById === request.user.id
      const isAdmin = request.user.role === "admin"

      if (!isCreator && !isAdmin) {
        forbidden(reply, "You don't have permission to delete this content")
        return
      }

      // Delete content
      await contentService.deleteContent(id)

      return { success: true, message: "Content deleted successfully" }
    }),
  )
}
