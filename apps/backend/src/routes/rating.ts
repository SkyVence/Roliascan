import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { apiHandler } from "../utils/handler"
import * as ratingService from "../services/rating"

const rateContentSchema = z.object({
  contentId: z.string().uuid(),
  rating: z.number().min(1).max(5),
})

const rateChapterSchema = z.object({
  chapterId: z.string().uuid(),
  rating: z.number().min(1).max(5),
})

export default async function (fastify: FastifyInstance) {
  // Rate content
  fastify.post(
    "/content",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: rateContentSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { contentId, rating } = request.body as z.infer<typeof rateContentSchema>

      try {
        await ratingService.rateContent({
          contentId,
          userId: request.user.id,
          rating,
        })

        return { message: "Rating submitted successfully" }
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

  // Rate chapter
  fastify.post(
    "/chapter",
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: rateChapterSchema,
      },
    },
    apiHandler(async (request, reply) => {
      const { chapterId, rating } = request.body as z.infer<typeof rateChapterSchema>

      try {
        await ratingService.rateChapter({
          chapterId,
          userId: request.user.id,
          rating,
        })

        return { message: "Rating submitted successfully" }
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

  // Get user's rating for content
  fastify.get(
    "/content/:contentId/user",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request) => {
      const { contentId } = request.params as { contentId: string }
      const rating = await ratingService.getUserContentRating(contentId, request.user.id)
      return { rating }
    }),
  )

  // Get user's rating for chapter
  fastify.get(
    "/chapter/:chapterId/user",
    {
      onRequest: [fastify.authenticate],
    },
    apiHandler(async (request) => {
      const { chapterId } = request.params as { chapterId: string }
      const rating = await ratingService.getUserChapterRating(chapterId, request.user.id)
      return { rating }
    }),
  )
}
