ALTER TABLE "titles" ALTER COLUMN "year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "titles" ADD COLUMN "chapterCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "titles" ADD COLUMN "volumeCount" integer DEFAULT 0 NOT NULL;