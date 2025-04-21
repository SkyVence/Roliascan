import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler, notFound, forbidden } from "../utils/handler"
import * as chapterService from "../services/chapter"
import * as contentService from "../services/content"
import { checkPermission } from "../services/permission"
import { uploadFile, ALLOWED_IMAGE_TYPES } from "../services/upload"

const createChapterSchema = z.object({
  contentId: z.string().uuid(),
  name: z.string().min(1),
  chapterNumber: z.number().positive(),
})

const updateChapterSchema = z.object({
  name: z.string().min(1).optional(),
  chapterNumber: z.number().positive().optional(),
})

export default async function (fastify: FastifyInstance) {
  // Get all chapters
  fastify.get(
    "/",
    apiHandler(async (request) => {
      const { contentId, page, limit } = request.query as any

      // If contentId is provided, get chapters for that content
      if (contentId) {
        const content = await contentService.getContent(contentId)
        if (!content) {
          return {
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 20,
              pages: 0,
            },
          }
        }

        return {
          data: content.chapters,
          pagination: {
            total: content.chapters.length,
            page: 1,
            limit: content.chapters.length,
            pages: 1,
          },
        }
      }

      // Otherwise, get all chapters with pagination
      // This would need to be implemented in the chapter service
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0,
        },
      }
    }),
  )

  // Get chapter by ID
  fastify.get(
    "/:id",
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const chapter = await chapterService.getChapter(id)

      if (!chapter) {
        notFound(reply, "Chapter not found")
        return
      }

      return chapter
    }),
  )

  // Create new chapter
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createChapterSchema,
      },
    },
    apiHandler(async (request, reply) => {
      // Check if user has permission to create chapters
      const hasPermission = await checkPermission(request.user.id, request.user.role, "create:chapter")
      if (!hasPermission) {
        forbidden(reply, "You don't have permission to create chapters")
        return
      }

      const { contentId, name, chapterNumber } = request.body as z.infer<typeof createChapterSchema>

      try {
        const chapter = await chapterService.createChapter({
          contentId,
          name,
          chapterNumber,
          createdById: request.user.id,
        })

        return { chapter }
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

  // Upload chapter images
  fastify.post(
    "/:id/images",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }

      // Get chapter
      const chapter = await chapterService.getChapter(id)
      if (!chapter) {
        notFound(reply, "Chapter not found")
        return
      }

      // Check if user is the creator or has admin/moderator role
      const isCreator = chapter.createdById === request.user.id
      const isAdminOrMod = ["admin", "moderator"].includes(request.user.role)

      if (!isCreator && !isAdminOrMod) {
        forbidden(reply, "You don't have permission to upload images to this chapter")
        return
      }

      const parts = request.parts()
      const uploadedImages = []

      for await (const part of parts) {
        if (part.type === "file") {
          // Validate file type
          const fileType = part.mimetype
          if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
            continue // Skip non-image files
          }

          // Get page number from field name or default to next available
          let pageNumber
          if (part.fieldname && part.fieldname.startsWith("page_")) {
            pageNumber = Number.parseInt(part.fieldname.replace("page_", ""), 10)
          } else {
            // Get highest page number and increment
            pageNumber = await chapterService.getHighestPageNumber(id)
          }

          // Upload file
          const result = await uploadFile({
            file: part,
            type: "chapter",
            id,
            userId: request.user.id,
          })

          // Save image info to database
          const image = await chapterService.saveChapterImage(id, result.fileUrl, result.fileKey, pageNumber)
          uploadedImages.push(image)
        }
      }

      return { images: uploadedImages }
    }),
  )

  // Update chapter
  fastify.patch(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: updateChapterSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const updates = request.body as z.infer<typeof updateChapterSchema>

      // Get chapter
      const chapter = await chapterService.getChapter(id)
      if (!chapter) {
        notFound(reply, "Chapter not found")
        return
      }

      // Check if user is the creator or has admin/moderator role
      const isCreator = chapter.createdById === request.user.id
      const isAdminOrMod = ["admin", "moderator"].includes(request.user.role)

      if (!isCreator && !isAdminOrMod) {
        forbidden(reply, "You don't have permission to update this chapter")
        return
      }

      try {
        // Update chapter
        const updatedChapter = await chapterService.updateChapter(id, updates)
        return { chapter: updatedChapter }
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

  // Delete chapter
  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }

      // Get chapter
      const chapter = await chapterService.getChapter(id)
      if (!chapter) {
        notFound(reply, "Chapter not found")
        return
      }

      // Check if user is the creator or has admin role
      const isCreator = chapter.createdById === request.user.id
      const isAdmin = request.user.role === "admin"

      if (!isCreator && !isAdmin) {
        forbidden(reply, "You don't have permission to delete this chapter")
        return
      }

      // Delete chapter
      const success = await chapterService.deleteChapter(id)
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: "Failed to delete chapter",
        })
      }

      return { success: true, message: "Chapter deleted successfully" }
    }),
  )
}
