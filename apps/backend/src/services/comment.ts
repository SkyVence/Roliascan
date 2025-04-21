import { db } from "../db"
import { comments, users, chapters } from "@/schemas/index"
import { eq, sql, desc } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

interface CreateCommentParams {
  chapterId: string
  userId: string
  content: string
}

interface UpdateCommentParams {
  content: string
}

interface GetCommentsParams {
  chapterId: string
  page?: number
  limit?: number
}

/**
 * Create a new comment
 * @param params Comment creation parameters
 * @returns Created comment
 */
export async function createComment(params: CreateCommentParams) {
  const { chapterId, userId, content } = params

  // Create comment
  const commentId = uuidv4()
  await db.insert(comments).values({
    id: commentId,
    chapterId,
    userId,
    content,
  })

  // Get created comment with user info
  const result = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      user: {
        id: users.id,
        username: users.username,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, commentId))
    .limit(1)

  return result[0]
}

/**
 * Get comments for a chapter
 * @param params Query parameters
 * @returns Comments with pagination info
 */
export async function getComments(params: GetCommentsParams) {
  const { chapterId, page = 1, limit = 20 } = params
  const offset = (page - 1) * limit

  // Get total count for pagination
  const countResult = await db.select({ count: sql`count(*)` }).from(comments).where(eq(comments.chapterId, chapterId))

  const total = Number(countResult[0].count)

  // Get comments with user info
  const commentList = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      user: {
        id: users.id,
        username: users.username,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.chapterId, chapterId))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: commentList,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get comment by ID
 * @param id Comment ID
 * @returns Comment or null if not found
 */
export async function getComment(id: string) {
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1)
  return result.length > 0 ? result[0] : null
}

/**
 * Update comment
 * @param id Comment ID
 * @param params Update parameters
 * @returns Updated comment
 */
export async function updateComment(id: string, params: UpdateCommentParams) {
  const { content } = params

  // Update comment
  await db
    .update(comments)
    .set({
      content,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(comments.id, id))

  // Get updated comment
  const result = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      user: {
        id: users.id,
        username: users.username,
      },
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, id))
    .limit(1)

  return result[0]
}

/**
 * Delete comment
 * @param id Comment ID
 * @returns Boolean indicating success
 */
export async function deleteComment(id: string) {
  // Delete comment
  const result = await db.delete(comments).where(eq(comments.id, id))
  return result.rowCount > 0
}

/**
 * Check if chapter exists
 * @param chapterId Chapter ID
 * @returns Boolean indicating if chapter exists
 */
export async function chapterExists(chapterId: string) {
  const result = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1)
  return result.length > 0
}
