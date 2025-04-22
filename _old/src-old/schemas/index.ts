import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 70 }).notNull(),
    email: varchar('email', { length: 70 }).notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    password: varchar('password', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const userRelations = relations(users, ({ many }) => ({
    comments: many(comments),
    content: many(contents),
}))

export const contents = pgTable('contents', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255}).notNull(),
    slug: varchar('slug', { length: 255}).notNull(),
    uploaderId: uuid('uploader_id').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const contentRelations = relations(contents, ({ many }) => ({
    chapters: many(chapters),
}))

export const chapters = pgTable('chapters', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255}).notNull(),
    chatperNumber: integer('chatper_number').notNull().unique(),
    slug: varchar('slug', { length: 255}).notNull(),
    contentId: uuid('content_id').references(() => contents.id),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const chapterRelations = relations(chapters, ({ one }) => ({
    content: one(contents, {
        fields: [chapters.contentId],
        references: [contents.id],
    }),
}))

export const comments = pgTable('comments', {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').references(() => contents.id),
    chapterId: uuid('chapter_id').references(() => chapters.id),
    userId: uuid('user_id').references(() => users.id),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const commentRelations = relations(comments, ({ one }) => ({
    content: one(contents, {
        fields: [comments.contentId],
        references: [contents.id],
    }),
    chapter: one(chapters, {
        fields: [comments.chapterId],
        references: [chapters.id],
    }),
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
}))