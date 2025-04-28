import { boolean, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { role } from "./enum.schema";

export const usersTable = pgTable("users", {
    id: uuid("userId").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),

    // Enum
    role: role("role").notNull().default("user"),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").$onUpdate(() => new Date()).notNull(),
})