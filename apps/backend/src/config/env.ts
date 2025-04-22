import { z } from "zod"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Define environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Database
  DATABASE_URL: z.string().min(1),

  // Upload
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  UPLOAD_METHOD: z.enum(["server", "cdn"]).default("server"),

  // UploadThing (only required if UPLOAD_METHOD is "cdn")
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // CORS
  TRUSTED_FRONTEND_URLS: z.string().min(1), // Expect comma-separated URLs
})

// Parse and validate environment variables
const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format())
  throw new Error("Invalid environment variables")
}

// Export validated environment variables
export const env = _env.data
