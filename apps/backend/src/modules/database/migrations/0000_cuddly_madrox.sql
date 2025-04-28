CREATE TYPE "public"."chapterStatus" AS ENUM('draft', 'published', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."rating_enum" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'moderator', 'user');--> statement-breakpoint
CREATE TYPE "public"."teamRole" AS ENUM('owner', 'admin', 'moderator', 'user');--> statement-breakpoint
CREATE TYPE "public"."titleStatus" AS ENUM('ongoing', 'completed', 'cancelled', 'hiatus');--> statement-breakpoint
CREATE TYPE "public"."titleType" AS ENUM('manga', 'manhwa', 'manhua', 'comic', 'other');--> statement-breakpoint
CREATE TABLE "users" (
	"userId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"titleId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"authorId" uuid NOT NULL,
	"uploaderId" uuid NOT NULL,
	"status" "titleStatus" DEFAULT 'ongoing' NOT NULL,
	"type" "titleType" DEFAULT 'manga' NOT NULL,
	"year" integer NOT NULL,
	"chapterCount" integer DEFAULT 0 NOT NULL,
	"volumeCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"chapterId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"chapterNumber" integer NOT NULL,
	"volumeNumber" integer,
	"pages" integer NOT NULL,
	"titleId" uuid NOT NULL,
	"uploaderId" uuid,
	"uploadTeamId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapterContent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"chapterId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "titleCovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"image_url" text NOT NULL,
	"titleId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapterCover" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"image_url" text NOT NULL,
	"chapterId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploadTeams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"userId" uuid NOT NULL,
	"titleId" uuid,
	"chapterId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rating" "rating_enum" NOT NULL,
	"userId" uuid NOT NULL,
	"titleId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titleId" uuid NOT NULL,
	"genreId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"userId" uuid NOT NULL,
	"teamId" uuid NOT NULL,
	"role" "teamRole" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "team_members_userId_teamId_pk" PRIMARY KEY("userId","teamId")
);
--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_authorId_authors_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_uploaderId_users_userId_fk" FOREIGN KEY ("uploaderId") REFERENCES "public"."users"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_titleId_titles_titleId_fk" FOREIGN KEY ("titleId") REFERENCES "public"."titles"("titleId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_uploaderId_users_userId_fk" FOREIGN KEY ("uploaderId") REFERENCES "public"."users"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_uploadTeamId_uploadTeams_id_fk" FOREIGN KEY ("uploadTeamId") REFERENCES "public"."uploadTeams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapterContent" ADD CONSTRAINT "chapterContent_chapterId_chapters_chapterId_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapters"("chapterId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titleCovers" ADD CONSTRAINT "titleCovers_titleId_titles_titleId_fk" FOREIGN KEY ("titleId") REFERENCES "public"."titles"("titleId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapterCover" ADD CONSTRAINT "chapterCover_chapterId_chapters_chapterId_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapters"("chapterId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_titleId_titles_titleId_fk" FOREIGN KEY ("titleId") REFERENCES "public"."titles"("titleId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_chapterId_chapters_chapterId_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."chapters"("chapterId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_titleId_titles_titleId_fk" FOREIGN KEY ("titleId") REFERENCES "public"."titles"("titleId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_titleId_titles_titleId_fk" FOREIGN KEY ("titleId") REFERENCES "public"."titles"("titleId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_genreId_genres_id_fk" FOREIGN KEY ("genreId") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_uploadTeams_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."uploadTeams"("id") ON DELETE cascade ON UPDATE no action;