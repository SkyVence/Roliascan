import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters.schema";

export const chapterImagesTable = pgTable("chapterContent", {
    id: uuid("id").primaryKey().defaultRandom(),
    imageUrl: text("image_url").notNull(),
    
    // Foreign key
    chapterId: uuid("chapterId").notNull().references(() => chaptersTable.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
})