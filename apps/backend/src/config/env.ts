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

  // Database
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string(),


  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().transform((val) => parseInt(val)),
})

// Parse and validate environment variables
const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format())
  throw new Error("Invalid environment variables")
}

// Export validated environment variables
export const env = _env.data
