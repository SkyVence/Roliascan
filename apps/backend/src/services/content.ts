import { db } from "../db"
import { contents, chapters } from "@/schemas/index"
import { eq, and, sql, desc, asc } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import slugify from "slugify"
import { deleteFile } from "./upload"

interface CreateContentParams {
  name: string
  description?: string
  author: string
  coverImage?: string
  coverImageKey?: string
  createdById: string
}

interface UpdateContentParams {
  name?: string
  description?: string
  author?: string
  coverImage?: string
  coverImageKey?: string
}

interface GetContentsParams {
  page?: number
  limit?: number
  sort?: "newest" | "name"
}

/**
 * Create new content
 * @param params Content creation parameters
 * @returns Created content
 */
export async function createContent(params: CreateContentParams) {
  const { name, description, author, coverImage, coverImageKey, createdById } = params

  // Create slug from name
  const baseSlug = slugify(name, { lower: true, strict: true })
  let slug = baseSlug

  // Check if slug exists
  let slugExists = await db.select().from(contents).where(eq(contents.slug, slug)).limit(1)
  let counter = 1

  // If slug exists, append a number
  while (slugExists.length > 0) {
    slug = `${baseSlug}-${counter}`
    slugExists = await db.select().from(contents).where(eq(contents.slug, slug)).limit(1)
    counter++
  }

  // Create content
  const contentId = uuidv4()
  await db.insert(contents).values({
    id: contentId,
    name,
    slug,
    description: description || null,
    author,
    coverImage: coverImage || null,
    coverImageKey: coverImageKey || null,
    createdById,
  })

  // Get created content
  const result = await db.select().from(contents).where(eq(contents.id, contentId)).limit(1)
  return result[0]
}

/**
 * Get content by ID or slug
 * @param idOrSlug Content ID or slug
 * @returns Content or null if not found
 */
export async function getContent(idOrSlug: string) {
  // Check if it's an ID or slug
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  let content
  if (isId) {
    content = await db.select().from(contents).where(eq(contents.id, idOrSlug)).limit(1)
  } else {
    content = await db.select().from(contents).where(eq(contents.slug, idOrSlug)).limit(1)
  }

  if (content.length === 0) {
    return null
  }

  // Get chapters for this content
  const contentChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.contentId, content[0].id))
    .orderBy(asc(chapters.chapterNumber))

  // Get average rating
  const avgRating = await db.execute(sql`
    SELECT AVG(rating) as average
    FROM content_ratings
    WHERE content_id = ${content[0].id}
  `)

  return {
    ...content[0],
    chapters: contentChapters,
    rating: avgRating.rows[0]?.average ? Number(avgRating.rows[0].average).toFixed(1) : null,
  }
}

/**
 * Get all contents with pagination
 * @param params Pagination parameters
 * @returns Contents with pagination info
 */
export async function getContents(params: GetContentsParams = {}) {
  const { page = 1, limit = 20, sort = "newest" } = params
  const offset = (page - 1) * limit

  // Get total count for pagination
  const countResult = await db.select({ count: sql`count(*)` }).from(contents)
  const total = Number(countResult[0].count)

  // Get contents with chapter count
  const contentList = await db
    .select({
      id: contents.id,
      name: contents.name,
      slug: contents.slug,
      description: contents.description,
      author: contents.author,
      coverImage: contents.coverImage,
      coverImageKey: contents.coverImageKey,
      createdAt: contents.createdAt,
      chapterCount: sql`(SELECT COUNT(*) FROM ${chapters} WHERE ${chapters.contentId} = ${contents.id})`,
    })
    .from(contents)
    .orderBy(sort === "newest" ? desc(contents.createdAt) : asc(contents.name))
    .limit(limit)
    .offset(offset)

  return {
    data: contentList,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Update content
 * @param id Content ID
 * @param params Update parameters
 * @returns Updated content
 */
export async function updateContent(id: string, params: UpdateContentParams) {
  // Get content
  const content = await db.select().from(contents).where(eq(contents.id, id)).limit(1)
  if (content.length === 0) {
    return null
  }

  // Update slug if name is changed
  const updateData: any = { ...params }
  if (params.name) {
    const baseSlug = slugify(params.name, { lower: true, strict: true })
    let slug = baseSlug

    // Check if slug exists and is not the current one
    let slugExists = await db
      .select()
      .from(contents)
      .where(and(eq(contents.slug, slug), sql`${contents.id} != ${id}`))
      .limit(1)

    let counter = 1
    while (slugExists.length > 0) {
      slug = `${baseSlug}-${counter}`
      slugExists = await db
        .select()
        .from(contents)
        .where(and(eq(contents.slug, slug), sql`${contents.id} != ${id}`))
        .limit(1)
      counter++
    }

    updateData.slug = slug
  }

  // If cover image is being changed, delete the old one
  if (params.coverImage && content[0].coverImage && content[0].coverImage !== params.coverImage) {
    await deleteFile(content[0].coverImage, content[0].coverImageKey || undefined)
  }

  // Update content
  await db
    .update(contents)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(contents.id, id))

  // Get updated content
  const updatedContent = await db.select().from(contents).where(eq(contents.id, id)).limit(1)
  return updatedContent[0]
}

/**
 * Delete content
 * @param id Content ID
 * @returns Boolean indicating success
 */
export async function deleteContent(id: string) {
  // Get content
  const content = await db.select().from(contents).where(eq(contents.id, id)).limit(1)
  if (content.length === 0) {
    return false
  }

  // Delete cover image if exists
  if (content[0].coverImage) {
    await deleteFile(content[0].coverImage, content[0].coverImageKey || undefined)
  }

  // Delete content (cascade will delete chapters, comments, ratings)
  await db.delete(contents).where(eq(contents.id, id))
  return true
}
