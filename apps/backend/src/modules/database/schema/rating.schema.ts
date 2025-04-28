import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { ratingEnum } from "./enum.schema";
import { usersTable } from "./users.schema";
import { titlesTable } from "./titles.schema";

export const ratingsTable = pgTable("ratings", {
    id: uuid("id").primaryKey().defaultRandom(),
    rating: ratingEnum("rating").notNull(),
    
    // Foreign keys
    userId: uuid("userId").notNull().references(() => usersTable.id),
    titleId: uuid("titleId").notNull().references(() => titlesTable.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
});

// Define types to help with circular references
export type Rating = InferSelectModel<typeof ratingsTable>;
export type NewRating = InferInsertModel<typeof ratingsTable>;