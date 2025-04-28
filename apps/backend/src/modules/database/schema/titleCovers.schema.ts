import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { titlesTable } from "./titles.schema";

export const titleCoversTable = pgTable("titleCovers", {
    id: uuid("id").primaryKey().defaultRandom(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    imageUrl: text("image_url").notNull(),
    
    // Foreign key
    titleId: uuid("titleId").notNull().references(() => titlesTable.id),
})