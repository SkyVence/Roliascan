import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, PgSchema, varchar, uuid } from "drizzle-orm/pg-core";
import { title } from "./schema";

export const defineAuthorsTables = (schema: PgSchema<any>) => {
    const author = schema.table("author", {
        id: uuid('id').primaryKey().defaultRandom(),
        name: varchar('name', { length: 255 }).notNull(),
        description: text('description'),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
    });
    const authorsRelations = relations(author, ({ many }) => ({
        socials: many(authorSocials),
        titles: many(title),
    }));
    const authorSocials = schema.table("author_socials", {
        id: uuid('id').primaryKey().defaultRandom(),
        type: varchar('type', { length: 255 }).notNull(),
        url: varchar('url', { length: 255 }).notNull(),
        authorId: uuid('author_id').references(() => author.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
    });
    const authorSocialsRelations = relations(authorSocials, ({ one }) => ({
        author: one(author, {
            fields: [authorSocials.authorId],
            references: [author.id],
        }),
    }));
    return { author, authorSocials, authorsRelations, authorSocialsRelations };
};