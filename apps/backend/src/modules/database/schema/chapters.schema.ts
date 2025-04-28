import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { titlesTable } from "./titles.schema";
import { usersTable } from "./users.schema";
import { uploadTeamsTable } from "./uploadTeams.schema";

export const chaptersTable = pgTable("chapters", {
    id: uuid("chapterId").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    chapterNumber: integer("chapterNumber").notNull(),
    volumeNumber: integer("volumeNumber"),
    pages: integer("pages").notNull(),

    // Foreign keys
    titleId: uuid("titleId").notNull().references(() => titlesTable.id),
    uploaderId: uuid("uploaderId").references(() => usersTable.id),
    uploadTeamId: uuid("uploadTeamId").references(() => uploadTeamsTable.id),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
})