ALTER TABLE "api"."session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "api"."user" ADD COLUMN "role" text;--> statement-breakpoint
UPDATE "api"."user" SET "role" = 'user';--> statement-breakpoint
ALTER TABLE "api"."user" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "api"."user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "api"."user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "api"."user" ADD COLUMN "ban_expires" date;--> statement-breakpoint

UPDATE "api"."user" SET "role" = 'user' WHERE "id" = 'd9dP0q2ZawMBydk1rnkVhkwjYYt3cTPa';
