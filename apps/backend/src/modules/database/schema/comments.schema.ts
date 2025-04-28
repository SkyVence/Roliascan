import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users.schema";
import { titlesTable } from "./titles.schema";
import { chaptersTable } from "./chapters.schema";

export const commentsTable = pgTable("comments", {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    
    // Foreign keys
    userId: uuid("userId").notNull().references(() => usersTable.id),
    titleId: uuid("titleId").references(() => titlesTable.id),
    chapterId: uuid("chapterId").references(() => chaptersTable.id),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
})