import { pgTable, text, uuid, timestamp, boolean, integer, primaryKey, uniqueIndex } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// User related tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  isBanned: boolean("is_banned").notNull().default(false),
  isMuted: boolean("is_muted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const userRelations = relations(users, ({ many }) => ({
  comments: many(comments),
  contentRatings: many(contentRatings),
  chapterRatings: many(chapterRatings),
}))

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
})

export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.permissionId] }),
    }
  },
)

// Content related tables
export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  author: text("author").notNull(),
  coverImage: text("cover_image"),
  coverImageKey: text("cover_image_key"), // For CDN uploads
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const contentRelations = relations(contents, ({ many, one }) => ({
  chapters: many(chapters),
  ratings: many(contentRatings),
  createdBy: one(users, {
    fields: [contents.createdById],
    references: [users.id],
  }),
}))

export const chapters = pgTable("chapters", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentId: uuid("content_id")
    .notNull()
    .references(() => contents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const chapterRelations = relations(chapters, ({ many, one }) => ({
  content: one(contents, {
    fields: [chapters.contentId],
    references: [contents.id],
  }),
  images: many(chapterImages),
  comments: many(comments),
  ratings: many(chapterRatings),
  createdBy: one(users, {
    fields: [chapters.createdById],
    references: [users.id],
  }),
}))

export const chapterImages = pgTable("chapter_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  fileKey: text("file_key"), // For CDN uploads
  pageNumber: integer("page_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const chapterImagesRelations = relations(chapterImages, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterImages.chapterId],
    references: [chapters.id],
  }),
}))

// Interaction tables
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  chapterId: uuid("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const commentRelations = relations(comments, ({ one }) => ({
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}))

export const contentRatings = pgTable(
  "content_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5 stars
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      uniqueRating: uniqueIndex("unique_content_rating").on(table.contentId, table.userId),
    }
  },
)

export const contentRatingRelations = relations(contentRatings, ({ one }) => ({
  content: one(contents, {
    fields: [contentRatings.contentId],
    references: [contents.id],
  }),
  user: one(users, {
    fields: [contentRatings.userId],
    references: [users.id],
  }),
}))

export const chapterRatings = pgTable(
  "chapter_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5 stars
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      uniqueRating: uniqueIndex("unique_chapter_rating").on(table.chapterId, table.userId),
    }
  },
)

export const chapterRatingRelations = relations(chapterRatings, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterRatings.chapterId],
    references: [chapters.id],
  }),
  user: one(users, {
    fields: [chapterRatings.userId],
    references: [users.id],
  }),
}))
