import { relations } from "drizzle-orm";
import { PgSchema, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { title, titleToGenre } from "./schema";

export const defineGenreTables = (schema: PgSchema<any>) => {
  const genre = schema.table("genre", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  });
  const genreRelations = relations(genre, ({ many }) => ({
    titles: many(titleToGenre),
  }));
  return { genre, genreRelations };
};
