import { relations } from "drizzle-orm";
import {
  PgSchema,
  text,
  timestamp,
  uuid,
  varchar,
  PgTableWithColumns,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { author, chapter, genre, titleLinks } from "./schema";

export const defineTitleTables = (schema: PgSchema<any>) => {
  const titleStatus = schema.enum("titleStatus", ["ongoing", "completed", "cancelled", "hiatus"]);
  const titleType = schema.enum("titleType", ["manga", "manhwa", "manhua", "comic", "other"]);
  const title = schema.table("title", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    authorId: uuid("author_id").references(() => author.id, {
      onDelete: "cascade",
    }),
    status: titleStatus("status").default("ongoing"),
    type: titleType("type").default("manga"),
  });
  const titleRelations = relations(title, ({ one, many }) => ({
    author: one(author, {
      fields: [title.authorId],
      references: [author.id],
    }),
    links: many(titleLinks),
    chapters: many(chapter),
    genres: many(titleToGenre),
  }));
  const titleToGenre = schema.table(
    "title_to_genre",
    {
      titleId: uuid("title_id").references(() => title.id, {
        onDelete: "cascade",
      }),
      genreId: uuid("genre_id").references(() => genre.id, {
        onDelete: "cascade",
      }),
    },
    (t) => ({
      pk: primaryKey({ columns: [t.titleId, t.genreId] }),
    }),
  );
  const titleToGenreRelations = relations(titleToGenre, ({ one }) => ({
    title: one(title, {
      fields: [titleToGenre.titleId],
      references: [title.id],
    }),
    genre: one(genre, {
      fields: [titleToGenre.genreId],
      references: [genre.id],
    }),
  }));
  const titleLinks = schema.table("title_links", {
    id: uuid("id").primaryKey().defaultRandom(),
    titleId: uuid("title_id").references(() => title.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  });

  const titleLinksRelations = relations(titleLinks, ({ one }) => ({
    title: one(title, {
      fields: [titleLinks.titleId],
      references: [title.id],
    }),
  }));

  return {
    title,
    titleRelations,
    titleLinks,
    titleLinksRelations,
    titleToGenre,
    titleToGenreRelations,
    titleStatus,
    titleType,
  };
};
