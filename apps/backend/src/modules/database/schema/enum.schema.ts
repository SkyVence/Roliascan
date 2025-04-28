import { pgEnum } from "drizzle-orm/pg-core";

export const titleStatus = pgEnum("titleStatus", ["ongoing", "completed", "cancelled", "hiatus"])
export const titleType = pgEnum("titleType", ["manga", "manhwa", "manhua", "comic", "other"])
export const chapterStatus = pgEnum("chapterStatus", ["draft", "published", "hidden", "deleted"])
export const role = pgEnum("role", ["owner", "admin", "moderator", "user"])
export const teamRole = pgEnum("teamRole", ["owner", "admin", "moderator", "user"])
export const ratingEnum = pgEnum("rating_enum", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"])