export * from "./enum.schema"
export * from "./users.schema"
export * from "./titles.schema"
export * from "./chapters.schema"
export * from "./chapterContent.schema"
export * from "./titleCovers.schema"
export * from "./chapterCover.schema"
export * from "./uploadTeams.schema"
export * from "./authors.schema"
export * from "./comments.schema"
export * from "./rating.schema"
export * from "./genre.schema"
export * from "./teamMembers.schema"

import { relations } from "drizzle-orm";
import { usersTable } from "./users.schema";
import { titlesTable } from "./titles.schema";
import { chaptersTable } from "./chapters.schema";
import { chapterImagesTable } from "./chapterContent.schema";
import { titleCoversTable } from "./titleCovers.schema";
import { chapterCoverTable } from "./chapterCover.schema";
import { uploadTeamsTable } from "./uploadTeams.schema";
import { authorsTable } from "./authors.schema";
import { commentsTable } from "./comments.schema";
import { ratingsTable } from "./rating.schema";
import { genresTable, titleGenresTable } from "./genre.schema";
import { teamMembersTable } from "./teamMembers.schema";

// Users relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  uploadedTitles: many(titlesTable),
  uploadedChapters: many(chaptersTable),
  comments: many(commentsTable),
  ratings: many(ratingsTable),
  teamMemberships: many(teamMembersTable),
}));

// Titles relations
export const titlesRelations = relations(titlesTable, ({ one, many }) => ({
  uploader: one(usersTable, {
    fields: [titlesTable.uploaderId],
    references: [usersTable.id],
  }),
  author: one(authorsTable, {
    fields: [titlesTable.authorId],
    references: [authorsTable.id],
  }),
  rating: one(ratingsTable, {
    fields: [titlesTable.id],
    references: [ratingsTable.titleId],
  }),
  chapters: many(chaptersTable),
  covers: many(titleCoversTable),
  comments: many(commentsTable),
  genres: many(titleGenresTable),
}));

// Chapters relations
export const chaptersRelations = relations(chaptersTable, ({ one, many }) => ({
  title: one(titlesTable, {
    fields: [chaptersTable.titleId],
    references: [titlesTable.id],
  }),
  uploader: one(usersTable, {
    fields: [chaptersTable.uploaderId],
    references: [usersTable.id],
  }),
  uploadTeam: one(uploadTeamsTable, {
    fields: [chaptersTable.uploadTeamId],
    references: [uploadTeamsTable.id],
  }),
  content: many(chapterImagesTable),
  cover: many(chapterCoverTable),
  comments: many(commentsTable),
}));

// Chapter content relations
export const chapterImagesRelations = relations(chapterImagesTable, ({ one }) => ({
  chapter: one(chaptersTable, {
    fields: [chapterImagesTable.chapterId],
    references: [chaptersTable.id],
  }),
}));

// Title covers relations
export const titleCoversRelations = relations(titleCoversTable, ({ one }) => ({
  title: one(titlesTable, {
    fields: [titleCoversTable.titleId],
    references: [titlesTable.id],
  }),
}));

// Chapter cover relations
export const chapterCoverRelations = relations(chapterCoverTable, ({ one }) => ({
  chapter: one(chaptersTable, {
    fields: [chapterCoverTable.chapterId],
    references: [chaptersTable.id],
  }),
}));

// Upload teams relations
export const uploadTeamsRelations = relations(uploadTeamsTable, ({ many }) => ({
  chapters: many(chaptersTable),
  members: many(teamMembersTable),
}));

// Authors relations
export const authorsRelations = relations(authorsTable, ({ many }) => ({
  titles: many(titlesTable),
}));

// Comments relations
export const commentsRelations = relations(commentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
  title: one(titlesTable, {
    fields: [commentsTable.titleId],
    references: [titlesTable.id],
  }),
  chapter: one(chaptersTable, {
    fields: [commentsTable.chapterId],
    references: [chaptersTable.id],
  }),
}));

// Rating relations
export const ratingsRelations = relations(ratingsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [ratingsTable.userId],
    references: [usersTable.id],
  }),
  title: one(titlesTable, {
    fields: [ratingsTable.titleId],
    references: [titlesTable.id],
  }),
}));

// Genre relations
export const genreRelations = relations(genresTable, ({ many }) => ({
  titles: many(titleGenresTable),
}));

// Title-Genre many-to-many relation
export const titleGenresRelations = relations(titleGenresTable, ({ one }) => ({
  title: one(titlesTable, {
    fields: [titleGenresTable.titleId],
    references: [titlesTable.id],
  }),
  genre: one(genresTable, {
    fields: [titleGenresTable.genreId],
    references: [genresTable.id],
  }),
}));

// Team Members relations
export const teamMembersRelations = relations(teamMembersTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [teamMembersTable.userId],
    references: [usersTable.id],
  }),
  team: one(uploadTeamsTable, {
    fields: [teamMembersTable.teamId],
    references: [uploadTeamsTable.id],
  }),
}));

