import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { titlesTable } from "./titles.schema";

export const genresTable = pgTable("genres", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
});

// Many-to-many relationship between titles and genres
export const titleGenresTable = pgTable("title_genres", {
    id: uuid("id").primaryKey().defaultRandom(),
    titleId: uuid("titleId").notNull().references(() => titlesTable.id),
    genreId: uuid("genreId").notNull().references(() => genresTable.id),
});