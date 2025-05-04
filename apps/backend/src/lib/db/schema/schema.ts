import { pgSchema } from "drizzle-orm/pg-core";
import { defineAuthTables } from "./auth";
import { defineAuthorsTables } from "./authors";
import { defineTitleTables } from "./title";
import { defineChapterTables } from "./chapter";
import { defineGenreTables } from "./genre";

export const apiSchema = pgSchema("api");

type AuthTables = {
  user: any; session: any; account: any; verification: any; userRelations: any; organization: any; member: any; invitation: any;
};

type AuthorsTables = {
  author: any; authorSocials: any; authorsRelations: any; authorSocialsRelations: any;
};

type TitleTables = {
  title: any; titleRelations: any; titleLinks: any; titleLinksRelations: any; titleToGenre: any; titleToGenreRelations: any;
};

type ChapterTables = {
  chapter: any; chapterRelations: any; chapterContent: any; chapterContentRelations: any;
};

type GenreTables = {
  genre: any; genreRelations: any;
};

const authTables: AuthTables = defineAuthTables(apiSchema);
const authorsTables: AuthorsTables = defineAuthorsTables(apiSchema);
const titleTables: TitleTables = defineTitleTables(apiSchema);
const chapterTables: ChapterTables = defineChapterTables(apiSchema);
const genreTables: GenreTables = defineGenreTables(apiSchema);

export const { user, session, account, verification, userRelations, organization, member, invitation } = authTables;
export const { author, authorSocials, authorsRelations, authorSocialsRelations } = authorsTables;
export const { title, titleRelations, titleLinks, titleLinksRelations, titleToGenre, titleToGenreRelations } = titleTables;
export const { chapter, chapterRelations, chapterContent, chapterContentRelations } = chapterTables;
export const { genre, genreRelations } = genreTables;
