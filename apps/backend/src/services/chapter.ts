import { db } from "../db"
import { chapters, chapterImages, contents } from "@/schemas/index"
import { eq, and, sql, asc } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"
import { config } from "../config"
import { deleteFile } from "./upload"

interface CreateChapterParams {
  contentId: string
  name: string
  chapterNumber: number
  createdById: string
}

interface UpdateChapterParams {
  name?: string
  chapterNumber?: number
}

interface ChapterImage {
  id: string
  chapterId: string
  imageUrl: string
  fileKey?: string
  pageNumber: number
}

/**
 * Create a new chapter
 * @param params Chapter creation parameters
 * @returns Created chapter
 */
export async function createChapter(params: CreateChapterParams) {
  const { contentId, name, chapterNumber, createdById } = params

  // Check if content exists
  const content = await db.select().from(contents).where(eq(contents.id, contentId)).limit(1)
  if (content.length === 0) {
    throw new Error("Content not found")
  }

  // Check if chapter number already exists for this content
  const existingChapter = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.contentId, contentId), eq(chapters.chapterNumber, chapterNumber)))
    .limit(1)

  if (existingChapter.length > 0) {
    throw new Error("A chapter with this number already exists for this content")
  }

  // Create chapter
  const chapterId = uuidv4()
  await db.insert(chapters).values({
    id: chapterId,
    contentId,
    name,
    chapterNumber,
    createdById,
  })

  // Get created chapter
  const result = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1)
  return result[0]
}

/**
 * Get chapter by ID
 * @param id Chapter ID
 * @returns Chapter or null if not found
 */
export async function getChapter(id: string) {
  // Get chapter
  const chapter = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1)
  if (chapter.length === 0) {
    return null
  }

  // Get chapter images
  const images = await db
    .select()
    .from(chapterImages)
    .where(eq(chapterImages.chapterId, id))
    .orderBy(asc(chapterImages.pageNumber))

  // Get content info
  const content = await db
    .select({
      id: contents.id,
      name: contents.name,
      slug: contents.slug,
    })
    .from(contents)
    .where(eq(contents.id, chapter[0].contentId))
    .limit(1)

  // Get average rating
  const avgRating = await db.execute(sql`
    SELECT AVG(rating) as average
    FROM chapter_ratings
    WHERE chapter_id = ${id}
  `)

  return {
    ...chapter[0],
    content: content[0],
    images,
    rating: avgRating.rows[0]?.average ? Number(avgRating.rows[0].average).toFixed(1) : null,
  }
}

/**
 * Update chapter
 * @param id Chapter ID
 * @param params Update parameters
 * @returns Updated chapter
 */
export async function updateChapter(id: string, params: UpdateChapterParams) {
  // Get chapter
  const chapter = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1)
  if (chapter.length === 0) {
    return null
  }

  // If changing chapter number, check if it already exists
  if (params.chapterNumber) {
    const existingChapter = await db
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.contentId, chapter[0].contentId),
          eq(chapters.chapterNumber, params.chapterNumber),
          sql`${chapters.id} != ${id}`,
        ),
      )
      .limit(1)

    if (existingChapter.length > 0) {
      throw new Error("A chapter with this number already exists for this content")
    }
  }

  // Update chapter
  await db
    .update(chapters)
    .set({
      ...params,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(chapters.id, id))

  // Get updated chapter
  const result = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1)
  return result[0]
}

/**
 * Delete chapter
 * @param id Chapter ID
 * @returns Boolean indicating success
 */
export async function deleteChapter(id: string) {
  // Get chapter
  const chapter = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1)
  if (chapter.length === 0) {
    return false
  }

  // Get chapter images to delete them
  const images = await db.select().from(chapterImages).where(eq(chapterImages.chapterId, id))

  // Delete chapter (cascade will delete images, comments, ratings)
  await db.delete(chapters).where(eq(chapters.id, id))

  // Delete chapter images
  for (const image of images) {
    await deleteFile(image.imageUrl, image.fileKey)
  }

  // If using server upload, delete the chapter directory
  if (config.upload.method === "server") {
    const chapterDir = path.join(config.paths.uploads, "chapters", id)
    if (fs.existsSync(chapterDir)) {
      fs.rmSync(chapterDir, { recursive: true, force: true })
    }
  }

  return true
}

/**
 * Save chapter image
 * @param chapterId Chapter ID
 * @param imageUrl Image URL
 * @param fileKey Optional file key (for CDN uploads)
 * @param pageNumber Page number
 * @returns Saved image
 */
export async function saveChapterImage(
  chapterId: string,
  imageUrl: string,
  fileKey: string | undefined,
  pageNumber: number,
): Promise<ChapterImage> {
  // Save image info to database
  const imageId = uuidv4()
  await db.insert(chapterImages).values({
    id: imageId,
    chapterId,
    imageUrl,
    fileKey,
    pageNumber,
  })

  return {
    id: imageId,
    chapterId,
    imageUrl,
    fileKey,
    pageNumber,
  }
}

/**
 * Get highest page number for a chapter
 * @param chapterId Chapter ID
 * @returns Highest page number
 */
export async function getHighestPageNumber(chapterId: string): Promise<number> {
  const highestPage = await db
    .select({ max: sql`MAX(page_number)` })
    .from(chapterImages)
    .where(eq(chapterImages.chapterId, chapterId))

  return (highestPage[0].max || 0) + 1
}
