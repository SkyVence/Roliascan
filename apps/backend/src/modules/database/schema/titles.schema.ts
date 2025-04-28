import { pgTable, text, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { titleStatus, titleType } from "./enum.schema";
import { authorsTable } from "./authors.schema";
import { usersTable } from "./users.schema";

export const titlesTable = pgTable("titles", {
    id: uuid("titleId").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    
    // Foreign keys
    authorId: uuid("authorId").references(() => authorsTable.id).notNull(),
    uploaderId: uuid("uploaderId").references(() => usersTable.id).notNull(),
    
    status: titleStatus("status").notNull().default("ongoing"),
    type: titleType("type").notNull().default("manga"),
    year: integer("year").notNull(),
    chapterCount: integer("chapterCount").notNull().default(0),
    volumeCount: integer("volumeCount").notNull().default(0),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
});

// Define types to help with circular references
export type Title = InferSelectModel<typeof titlesTable>;
export type NewTitle = InferInsertModel<typeof titlesTable>;