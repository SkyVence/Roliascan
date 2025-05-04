CREATE TABLE "api"."temp_upload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_key" varchar(255) NOT NULL,
	"file_url" varchar(1024) NOT NULL,
	"uploaded_at" timestamp NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "temp_upload_file_key_unique" UNIQUE("file_key")
);
