import { integer, PgSchema, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { title, user } from "./schema";
import { relations } from "drizzle-orm";

export const defineChapterTables = (schema: PgSchema<any>) => {
    const chapter = schema.table("chapter", {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 255 }).notNull(),
        chapterNumber: integer('chapter_number').notNull(),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
        titleId: uuid('title_id').references(() => title.id, { onDelete: 'cascade' }),
        uploadedAt: timestamp('uploaded_at').notNull(),
        uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'cascade' }),
    });
    const chapterRelations = relations(chapter, ({ one, many }) => ({
        title: one(title, {
            fields: [chapter.titleId],
            references: [title.id],
        }),
        content: many(chapterContent),
        uploadedBy: one(user, {
            fields: [chapter.uploadedBy],
            references: [user.id],
        }),
    }));
    const chapterContent = schema.table("chapter_content", {
        id: uuid('id').primaryKey().defaultRandom(),
        chapterId: uuid('chapter_id').references(() => chapter.id, { onDelete: 'cascade' }),
        displayOrder: integer('display_order').notNull(),
        url: varchar('url', { length: 255 }).notNull(),
        key: varchar('key', { length: 255 }).notNull(),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
    });
    const chapterContentRelations = relations(chapterContent, ({ one }) => ({
        chapter: one(chapter, {
            fields: [chapterContent.chapterId],
            references: [chapter.id],
        }),
    }));
    return { chapter, chapterRelations, chapterContent, chapterContentRelations };
}
