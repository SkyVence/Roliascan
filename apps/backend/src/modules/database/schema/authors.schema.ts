import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const authorsTable = pgTable("authors", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
})
