import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters.schema";

export const chapterCoverTable = pgTable("chapterCover", {
    id: uuid("id").primaryKey().defaultRandom(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    imageUrl: text("image_url").notNull(),
    
    // Foreign key
    chapterId: uuid("chapterId").notNull().references(() => chaptersTable.id),
})