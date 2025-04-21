import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler, notFound, forbidden } from "../utils/handler"
import * as commentService from "../services/comment"
import * as userService from "../services/user"

const createCommentSchema = z.object({
  chapterId: z.string().uuid(),
  content: z.string().min(1).max(1000),
})

const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
})

export default async function (fastify: FastifyInstance) {
  // Get comments for a chapter
  fastify.get(
    "/chapter/:chapterId",
    apiHandler(async (request, reply) => {
      const { chapterId } = request.params as { chapterId: string }
      const { page, limit } = request.query as any

      // Check if chapter exists
      const chapterExists = await commentService.chapterExists(chapterId)
      if (!chapterExists) {
        notFound(reply, "Chapter not found")
        return
      }

      return commentService.getComments({
        chapterId,
        page: page ? Number.parseInt(page) : undefined,
        limit: limit ? Number.parseInt(limit) : undefined,
      })
    }),
  )

  // Create comment
  fastify.post(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createCommentSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { chapterId, content } = request.body as z.infer<typeof createCommentSchema>

      // Check if chapter exists
      const chapterExists = await commentService.chapterExists(chapterId)
      if (!chapterExists) {
        notFound(reply, "Chapter not found")
        return
      }

      // Check if user is muted
      const user = await userService.findUserById(request.user.id)
      if (!user) {
        notFound(reply, "User not found")
        return
      }

      if (user.isMuted) {
        forbidden(reply, "You are currently muted and cannot comment")
        return
      }

      // Create comment
      const comment = await commentService.createComment({
        chapterId,
        userId: request.user.id,
        content,
      })

      return { comment }
    }),
  )

  // Update comment
  fastify.patch(
    "/:id",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: updateCommentSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }
      const { content } = request.body as z.infer<typeof updateCommentSchema>

      // Get comment
      const comment = await commentService.getComment(id)
      if (!comment) {
        notFound(reply, "Comment not found")
        return
      }

      // Check if user is the author
      if (comment.userId !== request.user.id) {
        forbidden(reply, "You can only edit your own comments")
        return
      }

      // Update comment
      const updatedComment = await commentService.updateComment(id, { content })

      return { comment: updatedComment }
    }),
  )

  // Delete comment
  fastify.delete(
    "/:id",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request, reply) => {
      const { id } = request.params as { id: string }

      // Get comment
      const comment = await commentService.getComment(id)
      if (!comment) {
        notFound(reply, "Comment not found")
        return
      }

      // Check if user is the author or has admin/moderator role
      const isAuthor = comment.userId === request.user.id
      const isAdminOrMod = ["admin", "moderator"].includes(request.user.role)

      if (!isAuthor && !isAdminOrMod) {
        forbidden(reply, "You don't have permission to delete this comment")
        return
      }

      // Delete comment
      const success = await commentService.deleteComment(id)
      if (!success) {
        return reply.code(500).send({
          success: false,
          error: "Failed to delete comment",
        })
      }

      return { success: true, message: "Comment deleted successfully" }
    }),
  )
}
