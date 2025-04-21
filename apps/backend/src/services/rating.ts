import { db } from "../db"
import { contentRatings, chapterRatings, contents, chapters } from "@/schemas/index"
import { eq, and, sql } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

interface RateContentParams {
  contentId: string
  userId: string
  rating: number
}

interface RateChapterParams {
  chapterId: string
  userId: string
  rating: number
}

/**
 * Rate content
 * @param params Rating parameters
 * @returns Boolean indicating success
 */
export async function rateContent(params: RateContentParams) {
  const { contentId, userId, rating } = params

  // Check if content exists
  const content = await db.select().from(contents).where(eq(contents.id, contentId)).limit(1)
  if (content.length === 0) {
    throw new Error("Content not found")
  }

  // Check if user already rated this content
  const existingRating = await db
    .select()
    .from(contentRatings)
    .where(and(eq(contentRatings.contentId, contentId), eq(contentRatings.userId, userId)))
    .limit(1)

  if (existingRating.length > 0) {
    // Update existing rating
    await db
      .update(contentRatings)
      .set({
        rating,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(contentRatings.id, existingRating[0].id))
  } else {
    // Create new rating
    const ratingId = uuidv4()
    await db.insert(contentRatings).values({
      id: ratingId,
      contentId,
      userId,
      rating,
    })
  }

  return true
}

/**
 * Rate chapter
 * @param params Rating parameters
 * @returns Boolean indicating success
 */
export async function rateChapter(params: RateChapterParams) {
  const { chapterId, userId, rating } = params

  // Check if chapter exists
  const chapter = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1)
  if (chapter.length === 0) {
    throw new Error("Chapter not found")
  }

  // Check if user already rated this chapter
  const existingRating = await db
    .select()
    .from(chapterRatings)
    .where(and(eq(chapterRatings.chapterId, chapterId), eq(chapterRatings.userId, userId)))
    .limit(1)

  if (existingRating.length > 0) {
    // Update existing rating
    await db
      .update(chapterRatings)
      .set({
        rating,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chapterRatings.id, existingRating[0].id))
  } else {
    // Create new rating
    const ratingId = uuidv4()
    await db.insert(chapterRatings).values({
      id: ratingId,
      chapterId,
      userId,
      rating,
    })
  }

  return true
}

/**
 * Get user's rating for content
 * @param contentId Content ID
 * @param userId User ID
 * @returns Rating or null if not found
 */
export async function getUserContentRating(contentId: string, userId: string) {
  const result = await db
    .select({ rating: contentRatings.rating })
    .from(contentRatings)
    .where(and(eq(contentRatings.contentId, contentId), eq(contentRatings.userId, userId)))
    .limit(1)

  return result.length > 0 ? result[0].rating : null
}

/**
 * Get user's rating for chapter
 * @param chapterId Chapter ID
 * @param userId User ID
 * @returns Rating or null if not found
 */
export async function getUserChapterRating(chapterId: string, userId: string) {
  const result = await db
    .select({ rating: chapterRatings.rating })
    .from(chapterRatings)
    .where(and(eq(chapterRatings.chapterId, chapterId), eq(chapterRatings.userId, userId)))
    .limit(1)

  return result.length > 0 ? result[0].rating : null
}

/**
 * Get average rating for content
 * @param contentId Content ID
 * @returns Average rating or null if no ratings
 */
export async function getContentAverageRating(contentId: string) {
  const avgRating = await db.execute(sql`
    SELECT AVG(rating) as average
    FROM content_ratings
    WHERE content_id = ${contentId}
  `)

  return avgRating.rows[0]?.average ? Number(avgRating.rows[0].average).toFixed(1) : null
}

/**
 * Get average rating for chapter
 * @param chapterId Chapter ID
 * @returns Average rating or null if no ratings
 */
export async function getChapterAverageRating(chapterId: string) {
  const avgRating = await db.execute(sql`
    SELECT AVG(rating) as average
    FROM chapter_ratings
    WHERE chapter_id = ${chapterId}
  `)

  return avgRating.rows[0]?.average ? Number(avgRating.rows[0].average).toFixed(1) : null
}
